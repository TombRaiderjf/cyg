import requests
import json
import base64
headers = {'content-type':'application/json'}
url="http://127.0.0.1:8/register"   #IP和端口号，注意register后要加/

with open("Q.jpg",'rb') as f:
    base64_data = base64.b64encode(f.read())

data = {
    'image': str(base64_data).split("'")[1]
}
r = requests.post(url, data=json.dumps(data),headers=headers)
print(r.text)

