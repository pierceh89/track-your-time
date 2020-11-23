// chart
const CHART_WEEK = 'week';
const CHART_MONTH = 'month';
const CHART_YEAR = 'year';
let chartMode = CHART_WEEK;
let chartMap = {
    'week': {
        labels: [],
        pomoData: [],
        breakData: [],
        rawData: []
    },
    'month': {
        labels: [],
        pomoData: [],
        breakData: [],
        rawData: []
    },
    'year': {
        labels: [],
        pomoData: [],
        breakData: [],
        rawData: []
    }
};
// timerMode
const POMODORO = 'pomodoro';
const BREAK = 'break';
const LONG_BREAK = 'long break';
// action
const ACTION_START = 'start';
const ACTION_STOP = 'stop';
const ACTION_RESUME = 'resume';

let configJson = window.localStorage.getItem('config');
let config;
let timerMode = POMODORO;

let pomodoroCount = 0;
let timerPeriod;
let timerElapsed;
let timerObj;
let behaviorObj = {};
if (configJson == null) {
    config = {
        'focus': 25,
        'break': 5,
        'longBreak': 15,
        'day': 10,
        'cycle': 4
    };
    window.localStorage.setItem('config', JSON.stringify(config));
} else {
    config = JSON.parse(configJson);
}

$(document).ready(function () {
    init();
});

function startTimer() {
    timerElapsed = 0;
    behaviorObj['start'] = new Date();
    if (timerMode === POMODORO) {
        // pomodoro timer
        timerPeriod = parseInt(config.focus) * 60; // to seconds
    } else if (timerMode === BREAK) {
        // break timer
        timerPeriod = parseInt(config.break) * 60;
    } else if (timerMode === LONG_BREAK) {
        // long break timer
        timerPeriod = parseInt(config.longBreak) * 60;
    }
    $('#state').text(timerMode);

    timerObj = setInterval(function() {

        timerElapsed += 1;
        const remainTime = $('#remain-time');
        const elapsedTime = $('#elapsed-time');

        let delta = timerPeriod - timerElapsed;

        if (delta < 0) {
            remainTime.text('00:00');
        } else {
            let remain_minutes = Math.floor(delta / 60);
            let remain_seconds = delta - remain_minutes * 60;

            let rm_str = remain_minutes.toString().padStart(2, '0');
            let rs_str = remain_seconds.toString().padStart(2, '0');

            remainTime.text(`${rm_str}:${rs_str}`);
        }

        let elapsed_minutes = Math.floor(timerElapsed / 60);
        let elapsed_seconds = timerElapsed - elapsed_minutes * 60;

        let em_str = elapsed_minutes.toString().padStart(2, '0');
        let es_str = elapsed_seconds.toString().padStart(2, '0');

        elapsedTime.text(`${em_str}:${es_str}`);

        if (timerElapsed < timerPeriod) {
            let elapsed_percent = timerElapsed/timerPeriod * 100;
            $('#timer-progress').css('width', `${elapsed_percent}%`);
        }

        if (timerElapsed === timerPeriod) {
            console.log('Ring!');
            timerRingAction();
        }
    }, 1000);
}

function checkNotificationPromise() {
    try {
        Notification.requestPermission().then();
    } catch(e) {
        return false;
    }
    return true;
}

function askNotificationPermission() {
    // 권한을 실제로 요구하는 함수
    function handlePermission(permission) {
        // 사용자의 응답에 관계 없이 크롬이 정보를 저장할 수 있도록 함
        if(!('permission' in Notification)) {
          Notification.permission = permission;
        }
    }

    // 브라우저가 알림을 지원하는지 확인
    if (!('Notification' in window)) {
        console.log("이 브라우저는 알림을 지원하지 않습니다.");
    } else {
        if (checkNotificationPromise()) {
            Notification.requestPermission()
            .then((permission) => {
              handlePermission(permission);
            })
        } else {
            Notification.requestPermission(function(permission) {
                handlePermission(permission);
            });
        }
    }
}

// pomodoro 초기화
// localStorage 에서 설정값 로드
function init() {
    $('#state').text(timerMode);
    $('#remain-time').text(`${config.focus}:00`);
    $('#elapsed-time').text('00:00');
    $('#timer-progress').css('width', '0%');
    let dateStr = toDateString(new Date());
    $.ajax({
        url: '/api/timer/count?date=' + dateStr,
        type: 'GET',
        success: function(response) {
            pomodoroCount = response['count'];
        }
    });
    checkNotificationPromise();
}

function timerRingAction() {
    let img = '/static/stopwatch.svg';
    let text = `${timerMode} has finished!`;
    let notification = new Notification('Pomodoro', { body: text, icon: img });
    behaviorObj['timerMode'] = timerMode;
    const startBtn = $('#startBtn');
    if (timerMode === POMODORO) {
        if (pomodoroCount > 0 && pomodoroCount % config.cycle === 0) {
            timerMode = LONG_BREAK;
        } else {
            timerMode = BREAK;
        }
        // update pomodoroCount
        pomodoroCount += 1;
        // update UI
        startBtn.show();
        startBtn.text('relax');
    } else {
        // break or long break
        timerMode = POMODORO;
        // update UI
        startBtn.hide();
        $('#resumeBtn').show();
    }
}

function stopTimer(act) {
    if (timerObj !== undefined) {
        let endTime = new Date();
        clearInterval(timerObj);
        timerObj = undefined;
        if (act === ACTION_RESUME || act == ACTION_STOP) {
            // force timerMode to POMODORO
            timerMode = POMODORO;
        }
        updateBehavior(behaviorObj['start'], endTime, timerElapsed, behaviorObj['timerMode']);
        init();
        $('#startBtn').text('start');
    }
}

function updateBehavior(start, end, elapsed, mode) {
    if (elapsed > timerPeriod) {
        let timePeriod = {
            'start': toDateTimeString(start),
            'end': toDateTimeString(end),
            'elapsed': elapsed,
            'timerMode': mode
        };
        // console.log(behavior);
        $.ajax({
            url: '/api/timer',
            type: 'POST',
            data: timePeriod,
            success: function(response) {
                if (response['result'] === 'success') {
                    pomodoroList.push(timePeriod);
                }
            }
        })
    }
}

function toDateString(date) {
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
}

function toDateTimeString(date) {
    let dateStr = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
    let timeStr = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

    return dateStr + ' ' + timeStr
}

// Pomodoro Settings
function applySettings() {
    let focusVal = $('#setFocus').val();
    let breakVal = $('#setBreak').val();
    let longBreakVal = $('#setLongBreak').val();
    let dayVal = $('#setDay').val();
    let cycleVal = $('#setCycle').val();
    config = {
        'focus': focusVal,
        'break': breakVal,
        'longBreak': longBreakVal,
        'day': dayVal,
        'cycle': cycleVal
    };
    window.localStorage.setItem('config', JSON.stringify(config));
    init();
    $('#settingsModal').modal('hide');
}
