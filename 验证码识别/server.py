from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import numpy as np
import random
import tensorflow as tf
import tensorflow.keras.backend as K
from tensorflow.keras.utils import Sequence
from tensorflow.keras.callbacks import Callback
from tensorflow.keras.models import *
from tensorflow.keras.layers import *
from tensorflow.keras.callbacks import EarlyStopping, CSVLogger, ModelCheckpoint
from tensorflow.keras.optimizers import *
import string
from PIL import Image
import base64
import io

app = Flask(__name__)


def identify_captcha(base64_img):
    image = base64.b64decode(base64_img)
    image = io.BytesIO(image)
    image = Image.open(image)
    x_test = np.array(np.array(image)/255.0).reshape((1, 30, 91, 3))
    # with graph.as_default():
    y_pred = base_model.predict(x_test)
    out = K.get_value(K.ctc_decode(y_pred, input_length=np.ones(y_pred.shape[0])*y_pred.shape[1], )[0][0])[:, :4]
    out = ''.join([characters[m] for m in out[0]])
    return out


characters = string.digits + string.ascii_uppercase
print(characters)

width, height, n_len, n_class = 91, 30, 4, len(characters) + 1

config = tf.ConfigProto()
config.gpu_options.allow_growth = True
sess = tf.Session(config=config)
K.set_session(sess)


def ctc_lambda_func(args):
    y_pred, labels, input_length, label_length = args
    return K.ctc_batch_cost(labels, y_pred, input_length, label_length)


input_tensor = Input((height, width, 3))
x = input_tensor
print('init', x)
for i, n_cnn in enumerate([2, 2, 2]):
    for j in range(n_cnn):
        x = Conv2D(32 * 2 ** min(i, 3), kernel_size=3, padding='same', kernel_initializer='he_uniform')(x)
        x = BatchNormalization()(x)
        x = Activation('relu')(x)
    x = MaxPooling2D(2 if i < 1 else (2, 1))(x)

x = Permute((2, 1, 3))(x)
x = TimeDistributed(Flatten())(x)

rnn_size = 64
x = Bidirectional(CuDNNGRU(rnn_size, return_sequences=True))(x)
x = Bidirectional(CuDNNGRU(rnn_size, return_sequences=True))(x)
x = Dense(n_class, activation='softmax')(x)

base_model = Model(inputs=input_tensor, outputs=x)

labels = Input(name='the_labels', shape=[n_len], dtype='float32')
input_length = Input(name='input_length', shape=[1], dtype='int64')
label_length = Input(name='label_length', shape=[1], dtype='int64')
loss_out = Lambda(ctc_lambda_func, output_shape=(1,), name='ctc')([x, labels, input_length, label_length])

model = Model(inputs=[input_tensor, labels, input_length, label_length], outputs=loss_out)
graph = tf.get_default_graph()
model.load_weights('ctc_best_new77.h5')

@app.route('/')
def hello_world():
    return 'hello world'


@app.route('/register', methods=['POST', 'GET'])
def register():
    print(request.headers)
    data = request.json
    print(data)
    res = identify_captcha(data['image'])
    print(res)
    return res


# if __name__ == '__main__':
CORS(app, supports_credentials=True)
app.run(port=8, debug=False, threaded=False)