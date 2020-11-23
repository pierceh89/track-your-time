function createTimeRange(from, to, chartType) {
    if (chartType === CHART_WEEK || chartType === CHART_MONTH) {
        let fromDate = new Date(from);
        let toDate = new Date(to);
        // 날짜별 range
        let range = toDate.getDate() - fromDate.getDate();
        let ret = [toDateString(fromDate)];
        for (let i = 0; i < range; i++) {
            fromDate.setDate(fromDate.getDate() + 1);
            ret.push(toDateString(fromDate));
        }
        return ret;
    } else {
        // CHART_YEAR 월별 range
        return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    }
}

function groupByTimeRange(range, timePeriods, chartType) {
    let ret = {};
    for (let i = 0; i < range.length; i++) {
        let rangeStr = range[i];
        let rangeMap = {
            "pomodoro": [],
            "break": []
        };
        ret[rangeStr] = rangeMap;
    }
    for (let i = 0; i < timePeriods.length; i++) {
        let timePeriod = timePeriods[i];
        if (chartType === CHART_WEEK || chartType === CHART_MONTH) {
            let d = new Date(timePeriod['start']);
            let dStr = toDateString(d);
            if (timePeriod['timerMode'] === POMODORO) {
                ret[dStr][POMODORO].push(timePeriod);
            } else {
                ret[dStr][BREAK].push(timePeriod);
            }
        } else {
            let d = new Date(timePeriod['start']);
            let month = d.getMonth() + 1;
            if (timePeriod['timerMode'] === POMODORO) {
                ret[month.toString()][POMODORO].push(timePeriod);
            } else {
                ret[month.toString()][BREAK].push(timePeriod);
            }
        }
    }
    return ret;
}

function groupByCount(range, map) {
    let pomoCounts = [];
    let breakCounts = [];
    for (let i = 0; i < range.length; i++) {
        pomoCounts.push(map[range[i]][POMODORO].length);
        breakCounts.push(map[range[i]][BREAK].length);
    }

    return [pomoCounts, breakCounts];
}

function initChart(chartType) {
    let dateStr = toDateString(new Date());
    $.ajax({
        url: `/api/timer/${chartType}?query=${dateStr}`,
        type: 'GET',
        data: {},
        success: function (response) {
            if (response['result'] === 'success') {
                const fromDateStr = response['from_date'];
                const toDateStr = response['to_date'];
                const timePeriods = response['time_periods'];
                let chartRange = createTimeRange(fromDateStr, toDateStr, chartType);
                console.log(chartRange);
                let groupByTimeRangeMap = groupByTimeRange(chartRange, timePeriods, chartType);
                console.log(groupByTimeRangeMap);
                let counts = groupByCount(chartRange, groupByTimeRangeMap);
                console.log(counts);
                chartMap[chartType]['labels'] = chartRange;
                chartMap[chartType]['pomoData'] = counts[0];
                chartMap[chartType]['breakData'] = counts[1];
                chartMap[chartType]['rawData'] = groupByTimeRangeMap;
                loadChart(chartType);
            }
        }
    })
}

function loadChart(chartType) {
    let ctx = document.getElementById('myChart').getContext('2d');
    let labels = chartMap[chartType]['labels'];
    let pomoData = chartMap[chartType]['pomoData'];
    let breakData = chartMap[chartType]['breakData'];
    let chart = new Chart(ctx, {
        // The type of chart we want to create
        type: 'line',
        // The data for our dataset
        data: {
            labels: labels,
            datasets: [{
                label: 'pomodoro',
                backgroundColor: 'rgb(28,178,101)',
                borderColor: 'rgb(28,178,101)',
                data: pomoData
            },
            {
                label: 'break',
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: breakData
            }]
        },

        // Configuration options go here
        options: {}
    });
}
