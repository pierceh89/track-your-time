from flask import Flask, render_template, jsonify, request
from pymongo import MongoClient
from datetime import datetime, timedelta
import calendar

DATETIME_FORMAT = '%Y-%m-%d %H:%M:%S'
DATE_FORMAT = '%Y-%m-%d'

client = MongoClient('localhost', 27017)
db = client.track_your_time

app = Flask(__name__)


@app.route("/")
def home():
    return render_template('index.html')


@app.route("/api/timer", methods=["POST"])
def insert_time_period():
    start_time = request.form['start']
    end_time = request.form['end']
    elapsed = request.form['elapsed']
    mode = request.form['timerMode']
    db.time_records.insert_one({
        'start': datetime.strptime(start_time, DATETIME_FORMAT),
        'end': datetime.strptime(end_time, DATETIME_FORMAT),
        'elapsed': int(elapsed),
        'timerMode': mode
    })
    return jsonify({
        "result": "success",

    })


@app.route("/api/timer/count", methods=["GET"])
def get_time_period_count_per_day():
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({
            "result": "fail",
            "message": "date is mandatory",
            "count": 0
        })

    date = datetime.strptime(date_str, DATE_FORMAT)
    from_date = date
    to_date = date + timedelta(days=1)
    count = db.time_records.count_documents({"start": {
        "$gte": from_date,
        "$lt": to_date
    }})
    return jsonify({
        "result": "success",
        "count": count
    })


@app.route("/api/timer/<query_type>", methods=["GET"])
def get_period_list_by(query_type):
    # month_str = request.args.get('month')
    # week_str = request.args.get('week')
    query_str = request.args.get('query')
    if not query_str:
        return jsonify({
            "result": "fail",
            "message": "query is mandatory",
            "count": 0
        })

    date = datetime.strptime(query_str, DATE_FORMAT)
    if query_type == 'date':
        from_date = date
        to_date = date + timedelta(days=1)
        time_period_list = list(db.time_records.find({"start": {
            "$gte": from_date,
            "$lt": to_date
        }}, {"_id": False}))
        time_period_list = transform_time_period(time_period_list)

    elif query_type == 'week':
        from_date, to_date = get_week_range(date)
        time_period_list = list(db.time_records.find({"start": {
            "$gte": from_date,
            "$lte": to_date
        }}, {"_id": False}))
        time_period_list = transform_time_period(time_period_list)

    elif query_type == 'month':
        from_date, to_date = get_month_range(date)
        time_period_list = list(db.time_records.find({"start": {
            "$gte": from_date,
            "$lte": to_date
        }}, {"_id": False}))
        time_period_list = transform_time_period(time_period_list)

    elif query_type == 'year':
        from_date, to_date = get_year_range(date)
        time_period_list = list(db.time_records.find({"start": {
            "$gte": from_date,
            "$lte": to_date
        }}, {"_id": False}))
        time_period_list = transform_time_period(time_period_list)

    else:
        return jsonify({
            "result": "fail",
            "message": "wrong query type",
            "count": 0
        })

    return jsonify({
        "result": "success",
        "time_periods": time_period_list,
        "count": len(time_period_list),
        "from_date": from_date.strftime(DATE_FORMAT),
        "to_date": to_date.strftime(DATE_FORMAT)
    })


def get_week_range(dt):
    nth_day = dt.weekday()
    if nth_day == 6:
        from_date = dt
        to_date = dt + timedelta(days=6)
    else:
        from_date = dt + timedelta(days=(-nth_day - 1))
        to_date = dt + timedelta(days=5 - nth_day)
    return from_date, to_date


def get_month_range(dt):
    year = dt.year
    month = dt.month
    days = calendar.monthrange(year, month)[1]
    from_date = datetime(year=year, month=month, day=1)
    to_date = datetime(year=year, month=month, day=days, hour=23, minute=59, second=59)
    return from_date, to_date


def get_year_range(dt):
    year = dt.year
    from_date = datetime(year=year, month=1, day=1)
    to_date = datetime(year=year, month=12, day=31, hour=23, minute=59, second=59)
    return from_date, to_date


def transform_time_period(time_period_list):
    ret = []
    for time_period in time_period_list:
        ret.append({
            'elapsed': time_period['elapsed'],
            'start': datetime.strftime(time_period['start'], DATETIME_FORMAT),
            'end': datetime.strftime(time_period['end'], DATETIME_FORMAT),
            'timerMode': time_period['timerMode']
        })
    return ret


if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)
