const STORAGE_KEY = 'modular-alarm-simple-state-v1';
const STATE_VERSION = 2;
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const nativeNotifyPort = Number(new URLSearchParams(location.search).get('notifyPort') || 0);
const normalizeTheme = theme => theme === 'light' || theme === 'black' ? theme : 'default';
const TRAINING_SCHEDULE = [
  {id:'period-1',name:'Period 1',nameKo:'1교시',time:'09:50',enabled:true},
  {id:'period-2',name:'Period 2',nameKo:'2교시',time:'10:50',enabled:true},
  {id:'period-3',name:'Period 3',nameKo:'3교시',time:'11:50',enabled:true},
  {id:'period-4',name:'Period 4',nameKo:'4교시',time:'12:50',enabled:true},
  {id:'period-5',name:'Period 5',nameKo:'5교시',time:'14:50',enabled:true},
  {id:'period-6',name:'Period 6',nameKo:'6교시',time:'15:50',enabled:true},
  {id:'period-7',name:'Period 7',nameKo:'7교시',time:'16:50',enabled:true},
  {id:'period-8',name:'Period 8',nameKo:'8교시',time:'17:50',enabled:true}
];

function createTrainingAlarm(){return{id:'morning-routine',name:'Training schedule',nameKo:'훈련생 시간표',time:'09:50',repeat:[0,1,2,3,4],enabled:true,expanded:true,modules:TRAINING_SCHEDULE.map(module=>({...module}))};}
const DEFAULT_ALARMS = [
  createTrainingAlarm(),
  { id:'lunch-break', name:'Lunch break', nameKo:'점심 휴식', time:'12:30', repeat:[0,1,2,3,4], enabled:true, expanded:false, modules:[
    {id:'lunch-start',name:'Take a break',nameKo:'쉬기',time:'12:30',enabled:true}
  ]},
  { id:'wind-down', name:'Wind down', nameKo:'저녁 정리', time:'22:30', repeat:[0,1,2,3,4,5,6], enabled:false, expanded:false, modules:[
    {id:'wind-down-start',name:'Slow down',nameKo:'천천히 쉬기',time:'22:30',enabled:true},
    {id:'lights-out',name:'Lights out',nameKo:'불 끄기',time:'23:00',enabled:true}
  ]}
];

const translations = {
  en:{appSubtitle:'ALARM WORKSPACE',addAlarm:'Add alarm',alarms:'Alarms',pageTitle:'Keep your morning simple.',pageDescription:'One alarm can hold multiple steps.',nextAlarm:'Next alarm',noAlarms:'No alarms yet',noAlarmsHint:'Create one alarm, then add as many modules as you need.',createFirstAlarm:'Create your first alarm',footerHint:'Keep this page open for alarms to ring.',enableSound:'Enable sound',soundReady:'Sound ready',soundEnabled:'Alarm sound enabled',savedLocally:'Saved locally',alarmEditor:'Alarm editor',newAlarmTitle:'New alarm',editAlarmTitle:'Edit alarm',alarmName:'Alarm name',alarmNamePlaceholder:'Morning routine',time:'Time',repeat:'Repeat',cancel:'Cancel',saveAlarm:'Save alarm',moduleEditor:'Alarm module',addModuleTitle:'Add a module',editModuleTitle:'Edit module',addModuleHint:'Add another time inside this alarm.',moduleName:'Module name',moduleNamePlaceholder:'Drink water',addModule:'Add module',saveModule:'Save module',modules:'Modules',editAlarm:'Edit alarm',deleteAlarm:'Delete alarm',close:'Close',start:'Start',afterMinutes:'+{{count}} min',everyDay:'Every day',weekdays:'Weekdays',once:'Once',active:'Active',paused:'Paused',moduleCount:'{{count}} modules',noModules:'No modules yet.',openModules:'Show modules',hideModules:'Hide modules',language:'Language',toggleAlarm:'Toggle alarm',toggleModule:'Toggle module',deleteModule:'Delete module',alarmRinging:'Alarm ringing',stopAlarm:'Stop alarm',toastAlarmAdded:'Alarm added',toastAlarmUpdated:'Alarm updated',toastAlarmDeleted:'Alarm deleted',toastModuleAdded:'Module added',toastModuleUpdated:'Module updated',toastModuleDeleted:'Module deleted',toastNoDays:'Choose at least one repeat day',toastAlarmOn:'Alarm turned on',toastAlarmOff:'Alarm paused',toastModuleOn:'Module turned on',toastModuleOff:'Module paused',defaultAlarmName:'New alarm',defaultModuleName:'Start alarm'},
  ko:{appSubtitle:'알람 워크스페이스',addAlarm:'알람 추가',alarms:'알람',pageTitle:'아침은 간단하게.',pageDescription:'알람 하나에 여러 단계를 담을 수 있어.',nextAlarm:'다음 알람',noAlarms:'아직 알람이 없어',noAlarmsHint:'알람 하나를 만들고 필요한 만큼 모듈을 추가해봐.',createFirstAlarm:'첫 알람 만들기',footerHint:'알람이 울리려면 이 페이지를 열어둬.',enableSound:'소리 켜기',soundReady:'소리 준비됨',soundEnabled:'알람 소리를 켰어',savedLocally:'로컬에 저장됨',alarmEditor:'알람 편집',newAlarmTitle:'새 알람',editAlarmTitle:'알람 편집',alarmName:'알람 이름',alarmNamePlaceholder:'모닝 루틴',time:'시간',repeat:'반복',cancel:'취소',saveAlarm:'알람 저장',moduleEditor:'알람 모듈',addModuleTitle:'모듈 추가',editModuleTitle:'모듈 편집',addModuleHint:'이 알람 안에 다음 시간을 추가해봐.',moduleName:'모듈 이름',moduleNamePlaceholder:'물 마시기',addModule:'모듈 추가',saveModule:'모듈 저장',modules:'모듈',editAlarm:'알람 편집',deleteAlarm:'알람 삭제',close:'닫기',start:'시작',afterMinutes:'+{{count}}분',everyDay:'매일',weekdays:'평일',once:'한 번',active:'활성',paused:'일시정지',moduleCount:'{{count}}개 모듈',noModules:'아직 모듈이 없어.',openModules:'모듈 보기',hideModules:'모듈 숨기기',language:'언어',toggleAlarm:'알람 켜기/끄기',toggleModule:'모듈 켜기/끄기',deleteModule:'모듈 삭제',alarmRinging:'알람이 울리고 있어',stopAlarm:'알람 끄기',toastAlarmAdded:'알람을 추가했어',toastAlarmUpdated:'알람을 수정했어',toastAlarmDeleted:'알람을 삭제했어',toastModuleAdded:'모듈을 추가했어',toastModuleUpdated:'모듈을 수정했어',toastModuleDeleted:'모듈을 삭제했어',toastNoDays:'반복할 요일을 하나 이상 선택해줘',toastAlarmOn:'알람을 켰어',toastAlarmOff:'알람을 잠시 멈췄어',toastModuleOn:'모듈을 켰어',toastModuleOff:'모듈을 잠시 껐어',defaultAlarmName:'새 알람',defaultModuleName:'알람 시작'}
};

Object.assign(translations.ko, {
  appSubtitle:'모듈러 알람 서비스',
  theme:'테마',
  themeDefault:'기본',
  themeWhite:'화이트',
  themeBlack:'블랙',
  enableSound:'소리 및 Windows 알림 켜기',
  soundReady:'소리 및 알림 준비 완료',
  soundEnabled:'알람 소리와 Windows 알림을 켰습니다.',
  notificationBlocked:'Windows 알림이 차단되어 있습니다. 브라우저 설정에서 허용해 주세요.',
  notificationUnavailable:'이 브라우저에서는 Windows 알림을 지원하지 않습니다.',
  pageTitle:'모듈러 알람으로 편리하게 관리하세요.',
  pageDescription:'알람 하나에 여러 단계를 설정할 수 있습니다.',
  noAlarms:'아직 알람이 없습니다.',
  noAlarmsHint:'알람 하나를 만들고 필요한 만큼 모듈을 추가해 보세요.',
  footerHint:'알람이 울리려면 이 페이지를 열어 두세요.',
  addModuleHint:'이 알람 안에 다음 시간을 추가해 보세요.',
  active:'활성화됨',
  paused:'일시 정지됨',
  noModules:'아직 모듈이 없습니다.',
  alarmRinging:'알람이 울리고 있습니다.',
  toastAlarmAdded:'알람을 추가했습니다.',
  toastAlarmUpdated:'알람을 수정했습니다.',
  toastAlarmDeleted:'알람을 삭제했습니다.',
  toastModuleAdded:'모듈을 추가했습니다.',
  toastModuleUpdated:'모듈을 수정했습니다.',
  toastModuleDeleted:'모듈을 삭제했습니다.',
  toastNoDays:'반복할 요일을 하나 이상 선택해 주세요.',
  toastAlarmOn:'알람을 켰습니다.',
  toastAlarmOff:'알람을 잠시 멈췄습니다.',
  toastModuleOn:'모듈을 켰습니다.',
  toastModuleOff:'모듈을 잠시 멈췄습니다.'
});

Object.assign(translations.en, {
  theme:'Theme',
  themeDefault:'Default',
  themeWhite:'White',
  themeBlack:'Black',
  enableSound:'Enable sound & notifications',
  soundReady:'Sound & notifications ready',
  soundEnabled:'Alarm sound and Windows notifications enabled',
  notificationBlocked:'Windows notifications are blocked. Allow them in browser settings.',
  notificationUnavailable:'Windows notifications are not supported by this browser.'
});

let state = loadState();
let selectedRepeat = [0,1,2,3,4];
let toastTimer; let audioContext = null; let audioReady = false; let soundLoopTimer = null; let soundRequest = 0; let ringingAlarm = null;
const triggeredAlarmKeys = new Set(); const defaultDocumentTitle = document.title;
const $ = (selector, parent=document) => parent.querySelector(selector);
const $$ = (selector, parent=document) => [...parent.querySelectorAll(selector)];

function loadState(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));if(saved&&Array.isArray(saved.alarms)){const alarms=structuredClone(saved.alarms);if(saved.scheduleVersion!==STATE_VERSION){const firstIndex=alarms.findIndex(alarm=>alarm.id==='morning-routine');if(firstIndex>=0)alarms[firstIndex]=createTrainingAlarm();else alarms.unshift(createTrainingAlarm());}return{language:saved.language==='ko'?'ko':'en',theme:normalizeTheme(saved.theme),scheduleVersion:STATE_VERSION,alarms};}}catch(error){}return{language:'en',theme:'default',scheduleVersion:STATE_VERSION,alarms:structuredClone(DEFAULT_ALARMS)};}
function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(error){}}
function lang(){return state.language==='ko'?'ko':'en';}
function t(key,values={}){let value=translations[lang()][key]??translations.en[key]??key;Object.entries(values).forEach(([keyName,replacement])=>{value=value.replaceAll(`{{${keyName}}}`,String(replacement));});return value;}
function esc(value){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
function localizedName(item){return lang()==='ko'&&item?.nameKo?item.nameKo:item?.name||'';}
function formatTime(time){const parts=String(time||'06:30').split(':').map(Number);const period=parts[0]>=12?'PM':'AM';return{value:`${parts[0]%12||12}:${String(parts[1]).padStart(2,'0')}`,period};}
function minutes(time){const p=String(time||'00:00').split(':').map(Number);return p[0]*60+p[1];}
function dayLabels(){return lang()==='ko'?['월','화','수','목','금','토','일']:['M','T','W','T','F','S','S'];}
function repeatText(repeat){const days=Array.isArray(repeat)?repeat:[];if(days.length===7)return t('everyDay');if(days.length===5&&days.every((day,index)=>day===index))return t('weekdays');if(!days.length)return t('once');return days.map(day=>dayLabels()[day]).join(' · ');}
function moduleOffset(alarm,module){const offset=minutes(module.time)-minutes(alarm.time);return offset<=0?t('start'):t('afterMinutes',{count:offset});}
function countText(count){return t('moduleCount',{count});}

function applyLanguage(){document.documentElement.lang=lang();$$('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));$$('[data-i18n-placeholder]').forEach(el=>el.placeholder=t(el.dataset.i18nPlaceholder));$$('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.i18nAria)));$$('.language-option').forEach(btn=>btn.classList.toggle('active',btn.dataset.language===lang()));renderRepeatPicker();updateSoundButton();}
function applyTheme(){state.theme=normalizeTheme(state.theme);document.documentElement.dataset.theme=state.theme;$$('.theme-option').forEach(btn=>btn.classList.toggle('active',btn.dataset.theme===state.theme));}
function renderRepeatPicker(){const picker=$('#repeat-picker');if(!picker)return;picker.innerHTML=dayLabels().map((label,index)=>`<button class="repeat-option ${selectedRepeat.includes(index)?'active':''}" type="button" data-repeat-day="${index}" aria-label="${label}">${label}</button>`).join('');}

function renderModule(alarm,module){const time=formatTime(module.time);return `<div class="module-row ${module.enabled?'':'is-disabled'}" data-alarm-id="${esc(alarm.id)}" data-module-id="${esc(module.id)}"><span class="module-dot"></span><time>${time.value} ${time.period}</time><div><strong>${esc(localizedName(module))}</strong><small>${esc(moduleOffset(alarm,module))}</small></div><label class="switch" aria-label="${esc(t('toggleModule'))}"><input type="checkbox" data-action="toggle-module" ${module.enabled?'checked':''}/><span class="switch-track"><span class="switch-thumb"></span></span></label><button class="icon-button module-edit" type="button" data-action="edit-module" aria-label="${esc(t('editModuleTitle'))}"><span class="icon icon-edit"></span></button><button class="icon-button danger" type="button" data-action="delete-module" aria-label="${esc(t('deleteModule'))}"><span class="icon icon-trash"></span></button></div>`;}
function renderAlarm(alarm){const modules=[...(alarm.modules||[])].sort((a,b)=>minutes(a.time)-minutes(b.time));const moduleContent=modules.length?modules.map(module=>renderModule(alarm,module)).join(''):`<div class="module-empty">${esc(t('noModules'))}</div>`;return `<article class="alarm-card ${alarm.enabled?'':'is-disabled'} ${alarm.expanded?'expanded':''}" data-alarm-id="${esc(alarm.id)}"><div class="alarm-row"><div class="alarm-time"><strong>${formatTime(alarm.time).value}</strong><span>${formatTime(alarm.time).period}</span></div><div class="alarm-info"><h2>${esc(localizedName(alarm))}</h2><p>${esc(repeatText(alarm.repeat))} <span>·</span> ${esc(countText(modules.length))}</p><div class="repeat-chips">${dayLabels().map((label,index)=>`<span class="repeat-chip ${alarm.repeat.includes(index)?'active':''}">${label}</span>`).join('')}</div></div><div class="alarm-actions"><button class="icon-button" type="button" data-action="edit-alarm" aria-label="${esc(t('editAlarm'))}"><span class="icon icon-edit"></span></button><button class="icon-button danger" type="button" data-action="delete-alarm" aria-label="${esc(t('deleteAlarm'))}"><span class="icon icon-trash"></span></button><label class="switch" aria-label="${esc(t('toggleAlarm'))}"><input type="checkbox" data-action="toggle-alarm" ${alarm.enabled?'checked':''}/><span class="switch-track"><span class="switch-thumb"></span></span></label><button class="expand-button" type="button" data-action="toggle-expanded" aria-label="${esc(alarm.expanded?t('hideModules'):t('openModules'))}"><span class="icon icon-chevron-down"></span></button></div></div><div class="module-panel ${alarm.expanded?'':'hidden'}"><div class="module-toolbar"><div><h3>${esc(t('modules'))}</h3><span>${esc(countText(modules.length))}</span></div><button class="add-module-button" type="button" data-action="add-module"><span class="icon icon-plus"></span><span>${esc(t('addModule'))}</span></button></div><div class="module-list">${moduleContent}</div></div></article>`;}
function renderAlarms(){const list=$('#alarm-list');const empty=$('#empty-state');if(!list||!empty)return;list.innerHTML=state.alarms.map(renderAlarm).join('');list.classList.toggle('hidden',!state.alarms.length);empty.classList.toggle('hidden',!!state.alarms.length);}
function renderAll(){applyLanguage();applyTheme();renderAlarms();updateSoundButton();saveState();}
function toast(message){const el=$('#toast');if(!el)return;clearTimeout(toastTimer);el.textContent=message;el.classList.add('show');toastTimer=setTimeout(()=>el.classList.remove('show'),2300);}

function nativeRequest(path,values={}){if(!nativeNotifyPort)return false;const query=Object.entries(values).map(([key,value])=>`${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');const beacon=document.createElement('img');beacon.alt='';beacon.hidden=true;beacon.src=`http://127.0.0.1:${nativeNotifyPort}${path}${query?`?${query}`:''}`;document.body.appendChild(beacon);setTimeout(()=>beacon.remove(),1500);return true;}
function nativePoll(){if(!nativeNotifyPort)return;fetch(`http://127.0.0.1:${nativeNotifyPort}/poll`,{cache:'no-store'}).then(response=>response.json()).then(result=>{if(result.stop&&ringingAlarm)stopRinging();}).catch(()=>{});}
function nativeShutdown(){nativeRequest('/shutdown');}
function notificationPermission(){return nativeNotifyPort?'granted':'Notification'in window?Notification.permission:'unsupported';}
function updateSoundButton(){const button=$('#enable-sound-button');if(!button)return;const permission=notificationPermission();const ready=audioReady&&(permission==='granted'||permission==='unsupported');const label=button.querySelector('[data-i18n]');if(label){label.dataset.i18n=ready?'soundReady':'enableSound';label.textContent=t(label.dataset.i18n);}button.classList.toggle('ready',ready);}
async function requestNotificationPermission(){const permission=notificationPermission();if(permission!=='default')return permission;try{return await Notification.requestPermission();}catch(error){return'denied';}}
async function unlockAudio(requestNotification=false){try{const AudioClass=window.AudioContext||window.webkitAudioContext;if(AudioClass&&!audioContext)audioContext=new AudioClass();if(audioContext?.state==='suspended')await audioContext.resume();const player=$('#alarm-audio');if(player)player.load();audioReady=!!audioContext&&audioContext.state==='running';}catch(error){audioReady=false;}const permission=requestNotification?await requestNotificationPermission():notificationPermission();updateSoundButton();if(requestNotification){const message=permission==='granted'&&audioReady?'soundEnabled':permission==='denied'?'notificationBlocked':permission==='unsupported'?'notificationUnavailable':'enableSound';toast(t(message));}}
function beep(){if(!audioContext||audioContext.state!=='running')return;const osc=audioContext.createOscillator();const gain=audioContext.createGain();const now=audioContext.currentTime;osc.type='sine';osc.frequency.setValueAtTime(880,now);osc.frequency.exponentialRampToValueAtTime(660,now+.24);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.22,now+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+.28);osc.connect(gain);gain.connect(audioContext.destination);osc.start(now);osc.stop(now+.3);}
function startSound(){stopSound();const request=++soundRequest;const player=$('#alarm-audio');if(player){player.loop=true;player.currentTime=0;const playback=player.play();if(playback&&typeof playback.catch==='function')playback.catch(()=>{if(request!==soundRequest||!ringingAlarm)return;beep();soundLoopTimer=setInterval(beep,900);});return;}beep();soundLoopTimer=setInterval(beep,900)}
function stopSound(){soundRequest++;clearInterval(soundLoopTimer);soundLoopTimer=null;const player=$('#alarm-audio');if(player){player.pause();player.currentTime=0;}}
function notify(alarm,module){const title=`${localizedName(alarm)} · ${localizedName(module)}`;const body=`${formatTime(module.time).value} ${formatTime(module.time).period}`;if(nativeRequest('/notify',{title,body,button:t('stopAlarm')}))return true;const permission=notificationPermission();if(permission==='unsupported')return false;if(permission!=='granted'){if(permission==='denied')toast(t('notificationBlocked'));return false;}try{const n=new Notification(title,{body,tag:`modular-${alarm.id}-${module.id}`,renotify:true,requireInteraction:true});n.onclick=()=>window.focus();return true;}catch(error){return false;}}
function ring(alarm,module){if(ringingAlarm)return;ringingAlarm={alarmId:alarm.id,moduleId:module.id};const time=formatTime(module.time);$('#ring-title').textContent=localizedName(module)||localizedName(alarm);$('#ring-time').textContent=`${time.value} ${time.period} · ${localizedName(alarm)}`;$('#ring-backdrop').classList.remove('hidden');document.title=`⏰ ${localizedName(module)||localizedName(alarm)}`;startSound();notify(alarm,module);toast(t('alarmRinging'));}
function stopRinging(){stopSound();ringingAlarm=null;$('#ring-backdrop').classList.add('hidden');document.title=defaultDocumentTitle;if(nativeNotifyPort)nativeRequest('/dismiss');}
function localDate(date){return`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function checkAlarms(){const now=new Date();const current=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;const today=(now.getDay()+6)%7;const date=localDate(now);state.alarms.forEach(alarm=>{if(!alarm.enabled||!alarm.repeat.includes(today))return;(alarm.modules||[]).forEach(module=>{if(!module.enabled||module.time!==current)return;const key=`${date}:${alarm.id}:${module.id}:${module.time}`;if(triggeredAlarmKeys.has(key))return;triggeredAlarmKeys.add(key);ring(alarm,module);});});if(triggeredAlarmKeys.size>500){const keep=[...triggeredAlarmKeys].slice(-250);triggeredAlarmKeys.clear();keep.forEach(key=>triggeredAlarmKeys.add(key));}}

function openBackdrop(id){$(id).classList.remove('hidden')}function closeBackdrop(id){$(id).classList.add('hidden')}
function openAlarmModal(id=''){const alarm=state.alarms.find(item=>item.id===id);$('#alarm-id').value=alarm?.id||'';$('#alarm-name').value=alarm?localizedName(alarm):t('defaultAlarmName');$('#alarm-time').value=alarm?.time||'07:00';selectedRepeat=alarm?[...alarm.repeat]:[0,1,2,3,4];$('#alarm-modal-title').textContent=alarm?t('editAlarmTitle'):t('newAlarmTitle');renderRepeatPicker();openBackdrop('#alarm-modal-backdrop');setTimeout(()=>$('#alarm-name').focus(),30)}
function openModuleModal(alarmId,moduleId=''){const alarm=state.alarms.find(item=>item.id===alarmId);if(!alarm)return;const module=alarm.modules.find(item=>item.id===moduleId);$('#module-alarm-id').value=alarm.id;$('#module-id').value=module?.id||'';$('#module-name').value=module?localizedName(module):'';$('#module-time').value=module?.time||alarm.time;$('#module-modal-title').textContent=module?t('editModuleTitle'):t('addModuleTitle');const submit=$('#module-form button[type="submit"]');submit.dataset.i18n=module?'saveModule':'addModule';submit.textContent=t(submit.dataset.i18n);openBackdrop('#module-modal-backdrop');setTimeout(()=>$('#module-name').focus(),30)}
function closeModals(){closeBackdrop('#alarm-modal-backdrop');closeBackdrop('#module-modal-backdrop')}
function saveAlarm(event){event.preventDefault();if(!selectedRepeat.length){toast(t('toastNoDays'));return}const id=$('#alarm-id').value;const name=$('#alarm-name').value.trim();const time=$('#alarm-time').value;const existing=state.alarms.find(alarm=>alarm.id===id);if(existing){const oldTime=existing.time;existing.name=name;delete existing.nameKo;existing.time=time;existing.repeat=[...selectedRepeat];(existing.modules||[]).forEach((module,index)=>{if(index===0&&module.time===oldTime)module.time=time});toast(t('toastAlarmUpdated'));}else{state.alarms.push({id:`alarm-${Date.now()}`,name,time,repeat:[...selectedRepeat],enabled:true,expanded:true,modules:[{id:`module-${Date.now()}`,name:t('defaultModuleName'),time,enabled:true}]});toast(t('toastAlarmAdded'));}closeModals();renderAll();}
function saveModule(event){event.preventDefault();const alarm=state.alarms.find(item=>item.id===$('#module-alarm-id').value);if(!alarm)return;const id=$('#module-id').value;const existing=alarm.modules.find(item=>item.id===id);if(existing){existing.name=$('#module-name').value.trim();delete existing.nameKo;existing.time=$('#module-time').value;}else{alarm.modules.push({id:`module-${Date.now()}`,name:$('#module-name').value.trim(),time:$('#module-time').value,enabled:true});}alarm.expanded=true;closeModals();renderAll();toast(t(existing?'toastModuleUpdated':'toastModuleAdded'));}
function findAlarm(id){return state.alarms.find(alarm=>alarm.id===id)}

document.addEventListener('click',event=>{
  const language=event.target.closest('[data-language]');if(language){state.language=language.dataset.language==='ko'?'ko':'en';renderAll();return}
  const theme=event.target.closest('[data-theme]');if(theme){state.theme=normalizeTheme(theme.dataset.theme);renderAll();return}
  const repeat=event.target.closest('[data-repeat-day]');if(repeat){const day=Number(repeat.dataset.repeatDay);selectedRepeat=selectedRepeat.includes(day)?selectedRepeat.filter(item=>item!==day):[...selectedRepeat,day].sort((a,b)=>a-b);renderRepeatPicker();return}
  const action=event.target.closest('[data-action]');if(action){const row=action.closest('[data-alarm-id]');const alarm=findAlarm(row?.dataset.alarmId);const moduleRow=action.closest('[data-module-id]');if(action.dataset.action==='edit-alarm'&&alarm)openAlarmModal(alarm.id);if(action.dataset.action==='delete-alarm'&&alarm){state.alarms=state.alarms.filter(item=>item.id!==alarm.id);renderAll();toast(t('toastAlarmDeleted'));}if(action.dataset.action==='toggle-expanded'&&alarm){alarm.expanded=!alarm.expanded;renderAlarms();saveState();}if(action.dataset.action==='add-module'&&alarm)openModuleModal(alarm.id);if(action.dataset.action==='edit-module'&&alarm&&moduleRow)openModuleModal(alarm.id,moduleRow.dataset.moduleId);if(action.dataset.action==='delete-module'&&alarm&&moduleRow){alarm.modules=alarm.modules.filter(module=>module.id!==moduleRow.dataset.moduleId);renderAll();toast(t('toastModuleDeleted'));}}
  if(event.target.closest('#add-alarm-button,#empty-add-button'))openAlarmModal();if(event.target.closest('#alarm-modal-close,#alarm-cancel-button'))closeBackdrop('#alarm-modal-backdrop');if(event.target.closest('#module-modal-close,#module-cancel-button'))closeBackdrop('#module-modal-backdrop');if(event.target.id==='alarm-modal-backdrop')closeBackdrop('#alarm-modal-backdrop');if(event.target.id==='module-modal-backdrop')closeBackdrop('#module-modal-backdrop');
});
document.addEventListener('change',event=>{const target=event.target.closest('[data-action]');if(!target)return;const alarm=findAlarm(target.closest('[data-alarm-id]')?.dataset.alarmId);if(!alarm)return;if(target.dataset.action==='toggle-alarm'){alarm.enabled=target.checked;renderAll();toast(t(target.checked?'toastAlarmOn':'toastAlarmOff'));}if(target.dataset.action==='toggle-module'){const module=alarm.modules.find(item=>item.id===target.closest('[data-module-id]')?.dataset.moduleId);if(module){module.enabled=target.checked;renderAll();toast(t(target.checked?'toastModuleOn':'toastModuleOff'));}}});
$('#alarm-form').addEventListener('submit',saveAlarm);$('#module-form').addEventListener('submit',saveModule);$('#enable-sound-button').addEventListener('click',()=>unlockAudio(true));$('#stop-alarm-button').addEventListener('click',stopRinging);document.addEventListener('pointerdown',()=>{if(!audioReady)unlockAudio(false)},{once:true});document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(ringingAlarm)stopRinging();else closeModals()}});document.addEventListener('visibilitychange',checkAlarms);if(nativeNotifyPort){window.addEventListener('pagehide',nativeShutdown,{once:true});window.setInterval(nativePoll,250);}window.setInterval(checkAlarms,1000);renderAll();checkAlarms();
