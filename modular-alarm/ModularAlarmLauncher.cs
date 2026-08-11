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
        using (var server = new LocalNotificationServer(context.ShowNotification, context.HideNotification, context.Exit))
        {
            context.SetStopAction(server.RequestStop);
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
        private readonly Form popup;
        private readonly Label popupTitle;
        private readonly Label popupBody;
        private readonly Button stopButton;
        private Action stopAction;

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

            popup = new Form
            {
                FormBorderStyle = FormBorderStyle.FixedSingle,
                ControlBox = false,
                ShowInTaskbar = false,
                ShowIcon = false,
                TopMost = true,
                StartPosition = FormStartPosition.Manual,
                ClientSize = new Size(380, 150),
                BackColor = Color.FromArgb(29, 33, 41),
                Padding = new Padding(18, 14, 18, 14)
            };
            popupTitle = new Label
            {
                AutoSize = false,
                Location = new Point(18, 14),
                Size = new Size(344, 26),
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 11, FontStyle.Bold)
            };
            popupBody = new Label
            {
                AutoSize = false,
                Location = new Point(18, 44),
                Size = new Size(344, 24),
                ForeColor = Color.FromArgb(205, 211, 222),
                Font = new Font("Segoe UI", 9, FontStyle.Regular)
            };
            stopButton = new Button
            {
                Location = new Point(226, 91),
                Size = new Size(136, 36),
                FlatStyle = FlatStyle.Flat,
                BackColor = Color.FromArgb(75, 126, 207),
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                UseVisualStyleBackColor = false
            };
            stopButton.FlatAppearance.BorderSize = 0;
            stopButton.Click += delegate
            {
                HideNotification();
                if (stopAction != null) stopAction();
            };
            popup.Controls.Add(popupTitle);
            popup.Controls.Add(popupBody);
            popup.Controls.Add(stopButton);

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

        public void SetStopAction(Action action)
        {
            stopAction = action;
        }

        public void ShowNotification(string title, string body, string buttonText)
        {
            RunOnUiThread(delegate
            {
                popupTitle.Text = Trim(title, 63);
                popupBody.Text = Trim(body, 255);
                stopButton.Text = Trim(string.IsNullOrEmpty(buttonText) ? "Stop alarm" : buttonText, 30);
                Rectangle workArea = Screen.PrimaryScreen.WorkingArea;
                popup.Location = new Point(workArea.Right - popup.Width - 20, workArea.Bottom - popup.Height - 20);
                popup.Show();
                popup.TopMost = true;
                popup.BringToFront();
                popup.Activate();
            });
        }

        public void HideNotification()
        {
            RunOnUiThread(delegate { popup.Hide(); });
        }

        public void Exit()
        {
            RunOnUiThread(delegate
            {
                popup.Hide();
                ExitThread();
            });
        }

        private void RunOnUiThread(Action action)
        {
            try
            {
                if (dispatcher.IsHandleCreated && dispatcher.InvokeRequired) dispatcher.BeginInvoke(action);
                else action();
            }
            catch (InvalidOperationException) { }
        }

        public new void Dispose()
        {
            popup.Dispose();
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
        private readonly Action<string, string, string> notifyCallback;
        private readonly Action dismissCallback;
        private readonly Action shutdownCallback;
        private TcpListener listener;
        private Thread thread;
        private volatile bool running;
        private int stopRequested;

        public LocalNotificationServer(Action<string, string, string> notifyCallback, Action dismissCallback, Action shutdownCallback)
        {
            this.notifyCallback = notifyCallback;
            this.dismissCallback = dismissCallback;
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

        public void RequestStop()
        {
            Interlocked.Exchange(ref stopRequested, 1);
            dismissCallback();
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
                        if (uri.AbsolutePath == "/notify")
                        {
                            notifyCallback(QueryValue(uri, "title"), QueryValue(uri, "body"), QueryValue(uri, "button"));
                            WriteResponse(stream, "ok", "text/plain; charset=utf-8");
                            return;
                        }
                        if (uri.AbsolutePath == "/dismiss")
                        {
                            dismissCallback();
                            WriteResponse(stream, "ok", "text/plain; charset=utf-8");
                            return;
                        }
                        if (uri.AbsolutePath == "/shutdown")
                        {
                            dismissCallback();
                            shutdownCallback();
                            WriteResponse(stream, "ok", "text/plain; charset=utf-8");
                            return;
                        }
                        if (uri.AbsolutePath == "/poll")
                        {
                            bool stop = Interlocked.Exchange(ref stopRequested, 0) == 1;
                            WriteResponse(stream, stop ? "{\"stop\":true}" : "{\"stop\":false}", "application/json; charset=utf-8");
                            return;
                        }
                    }
                }
                WriteResponse(stream, "ok", "text/plain; charset=utf-8");
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

        private static void WriteResponse(NetworkStream stream, string content, string contentType)
        {
            byte[] body = Encoding.UTF8.GetBytes(content);
            string headers = "HTTP/1.1 200 OK\r\nContent-Type: " + contentType + "\r\nContent-Length: " + body.Length + "\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n";
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
