// UI functions
function _toggleReport() {
    let report = $('#report');
    if (report.css('display') === 'flex') {
        report.hide();
    } else {
        initChart();
        report.show();
    }
}

function _openSettings() {
    $('#setFocus').val(config.focus);
    $('#setBreak').val(config.break);
    $('#setLongBreak').val(config.longBreak);
    $('#setDay').val(config.day);
    $('#setCycle').val(config.cycle);
    $('#settingsModal').modal('show');
}

function _action(act) {
    if (act === ACTION_START) {
        stopTimer(act);
        startTimer();
        $('#stopBtn').show();
        $('#startBtn').hide();
        if (timerMode !== POMODORO) {
            $('#resumeBtn').show();
        }
    } else if (act === ACTION_RESUME) {
        stopTimer(act);
        startTimer();
        $('#startBtn').hide();
        $('#resumeBtn').hide();
    } else { // ACTION_STOP
        stopTimer(act);
        $('#stopBtn').hide();
        $('#resumeBtn').hide();
        $('#startBtn').show();
    }
}
