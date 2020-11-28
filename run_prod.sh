#/bin/sh

source venv/bin/activate

export PYTHON_PATH=/home/ubuntu/track-your-time
uwsgi -s /tmp/track-your-time.sock --manage-script-name --mount /=flaskr:app --chmod-socket=666
