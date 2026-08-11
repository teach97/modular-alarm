using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;

internal static class ModularAlarmLauncher
{
    [STAThread]
    private static void Main()
    {
        string appDirectory = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ModularAlarm");
        Directory.CreateDirectory(appDirectory);
        ExtractResource("ModularAlarm.index.html", Path.Combine(appDirectory, "index.html"));
        ExtractResource("ModularAlarm.styles.css", Path.Combine(appDirectory, "styles.css"));
        ExtractResource("ModularAlarm.app.js", Path.Combine(appDirectory, "app.js"));
        ExtractResource("ModularAlarm.alarm_sound.m4a", Path.Combine(appDirectory, "alarm-sound.m4a"));

        string htmlPath = Path.Combine(appDirectory, "index.html");
        if (!File.Exists(htmlPath)) return;

        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        using (var context = new NotificationContext())
        using (var server = new LocalNotificationServer(context.ShowNotification, context.Exit))
        {
            server.Start();
            string browser = FindBrowser();
            string url = new Uri(htmlPath).AbsoluteUri + "?notifyPort=" + server.Port;

            if (!string.IsNullOrEmpty(browser))
            {
                Process.Start(new ProcessStartInfo { FileName = browser, Arguments = "--app=\"" + url + "\" --new-window", UseShellExecute = false, WorkingDirectory = appDirectory });
            }
            else
            {
                Process.Start(new ProcessStartInfo { FileName = url, UseShellExecute = true });
            }

            Application.Run(context);
        }
    }

    private static string FindBrowser()
    {
        string files = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string filesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string[] candidates = {
            Path.Combine(files, "Google", "Chrome", "Application", "chrome.exe"),
            Path.Combine(filesX86, "Google", "Chrome", "Application", "chrome.exe"),
            Path.Combine(local, "Google", "Chrome", "Application", "chrome.exe"),
            Path.Combine(files, "Microsoft", "Edge", "Application", "msedge.exe"),
            Path.Combine(filesX86, "Microsoft", "Edge", "Application", "msedge.exe")
        };
        foreach (string candidate in candidates) if (File.Exists(candidate)) return candidate;
        return string.Empty;
    }

    private static void ExtractResource(string name, string destination)
    {
        using (Stream input = Assembly.GetExecutingAssembly().GetManifestResourceStream(name))
        {
            if (input == null) return;
            using (FileStream output = File.Create(destination)) input.CopyTo(output);
        }
    }

    private sealed class NotificationContext : ApplicationContext, IDisposable
    {
        private readonly Form dispatcher;
        private readonly NotifyIcon notifyIcon;
        private readonly ContextMenuStrip menu;

        public NotificationContext()
        {
            dispatcher = new Form
            {
                FormBorderStyle = FormBorderStyle.None,
                ShowInTaskbar = false,
                ShowIcon = false,
                StartPosition = FormStartPosition.Manual,
                Location = new Point(-100, -100),
                Size = new Size(1, 1),
                Opacity = 0
            };
            dispatcher.Show();
            dispatcher.Hide();

            menu = new ContextMenuStrip();
            menu.Items.Add("Exit Modular Alarm", null, delegate { Exit(); });
            notifyIcon = new NotifyIcon
            {
                Icon = SystemIcons.Information,
                Text = "Modular Alarm",
                Visible = true,
                ContextMenuStrip = menu
            };
        }

        public void ShowNotification(string title, string body)
        {
            Action show = delegate
            {
                notifyIcon.BalloonTipTitle = Trim(title, 63);
                notifyIcon.BalloonTipText = Trim(body, 255);
                notifyIcon.BalloonTipIcon = ToolTipIcon.Info;
                notifyIcon.ShowBalloonTip(10000);
            };
            try
            {
                if (dispatcher.IsHandleCreated && dispatcher.InvokeRequired) dispatcher.BeginInvoke(show);
                else show();
            }
            catch (InvalidOperationException) { }
        }

        public void Exit()
        {
            try
            {
                if (dispatcher.IsHandleCreated && dispatcher.InvokeRequired) dispatcher.BeginInvoke(new MethodInvoker(ExitThread));
                else ExitThread();
            }
            catch (InvalidOperationException) { }
        }

        public new void Dispose()
        {
            notifyIcon.Visible = false;
            notifyIcon.Dispose();
            menu.Dispose();
            dispatcher.Close();
            dispatcher.Dispose();
        }

        private static string Trim(string value, int maxLength)
        {
            value = value ?? string.Empty;
            return value.Length <= maxLength ? value : value.Substring(0, maxLength);
        }
    }

    private sealed class LocalNotificationServer : IDisposable
    {
        private readonly Action<string, string> notifyCallback;
        private readonly Action shutdownCallback;
        private TcpListener listener;
        private Thread thread;
        private volatile bool running;

        public LocalNotificationServer(Action<string, string> notifyCallback, Action shutdownCallback)
        {
            this.notifyCallback = notifyCallback;
            this.shutdownCallback = shutdownCallback;
        }

        public int Port { get; private set; }

        public void Start()
        {
            listener = new TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            Port = ((IPEndPoint)listener.LocalEndpoint).Port;
            running = true;
            thread = new Thread(ListenLoop) { IsBackground = true, Name = "ModularAlarmNotificationServer" };
            thread.Start();
        }

        private void ListenLoop()
        {
            while (running)
            {
                TcpClient client = null;
                try
                {
                    client = listener.AcceptTcpClient();
                    Handle(client);
                }
                catch (SocketException)
                {
                    if (!running) break;
                }
                catch (ObjectDisposedException)
                {
                    if (!running) break;
                }
                catch { }
                finally
                {
                    if (client != null) client.Close();
                }
            }
        }

        private void Handle(TcpClient client)
        {
            using (NetworkStream stream = client.GetStream())
            {
                stream.ReadTimeout = 1500;
                string request = ReadRequest(stream);
                string target = RequestTarget(request);
                if (!string.IsNullOrEmpty(target))
                {
                    Uri uri;
                    if (Uri.TryCreate("http://127.0.0.1" + target, UriKind.Absolute, out uri))
                    {
                        if (uri.AbsolutePath == "/notify") notifyCallback(QueryValue(uri, "title"), QueryValue(uri, "body"));
                        if (uri.AbsolutePath == "/shutdown") shutdownCallback();
                    }
                }
                WriteResponse(stream);
            }
        }

        private static string ReadRequest(NetworkStream stream)
        {
            byte[] buffer = new byte[8192];
            int total = 0;
            while (total < buffer.Length)
            {
                int read = stream.Read(buffer, total, buffer.Length - total);
                if (read <= 0) break;
                total += read;
                if (total >= 4 && Encoding.ASCII.GetString(buffer, 0, total).IndexOf("\r\n\r\n", StringComparison.Ordinal) >= 0) break;
            }
            return Encoding.ASCII.GetString(buffer, 0, total);
        }

        private static string RequestTarget(string request)
        {
            string[] lines = request.Split(new[] { "\r\n" }, StringSplitOptions.None);
            if (lines.Length == 0) return string.Empty;
            string[] parts = lines[0].Split(' ');
            return parts.Length > 1 ? parts[1] : string.Empty;
        }

        private static string QueryValue(Uri uri, string key)
        {
            string query = uri.Query.TrimStart('?');
            foreach (string part in query.Split('&'))
            {
                int separator = part.IndexOf('=');
                if (separator < 0) continue;
                string name = Uri.UnescapeDataString(part.Substring(0, separator));
                if (name != key) continue;
                return Uri.UnescapeDataString(part.Substring(separator + 1).Replace('+', ' '));
            }
            return string.Empty;
        }

        private static void WriteResponse(NetworkStream stream)
        {
            byte[] body = Encoding.UTF8.GetBytes("ok");
            string headers = "HTTP/1.1 200 OK\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: " + body.Length + "\r\nConnection: close\r\n\r\n";
            byte[] headerBytes = Encoding.ASCII.GetBytes(headers);
            stream.Write(headerBytes, 0, headerBytes.Length);
            stream.Write(body, 0, body.Length);
            stream.Flush();
        }

        public void Dispose()
        {
            running = false;
            if (listener != null) listener.Stop();
            if (thread != null && thread.IsAlive && Thread.CurrentThread != thread) thread.Join(500);
        }
    }
}
