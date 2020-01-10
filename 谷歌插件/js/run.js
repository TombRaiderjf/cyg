
method = 'POST';


id = window.location.href.split("=")[1];
image_url = "http://tl.cyg.changyou.com/transaction/captcha-image?goods_serial_num=" + id;

/**
 * 获取图像的 Base64 编码
 */
function getImgBase64(path, callback) {
    var img = new Image();
    img.src = path;
    img.setAttribute("crossOrigin", 'Anonymous');
    //图片加载完成后触发
    img.onload = function () {
        var canvas = document.createElement("canvas");
        //获取绘画上下文
        ctx = canvas.getContext("2d");

        // 获取图片宽高
        var imgWidth = img.width;
        var imgHeight = img.height;

        //设置画布宽高与图片宽高相同
        canvas.width = imgWidth;
        canvas.height = imgHeight;

        //绘制图片
        ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
        //图片展示的 data URI
        var dataUrl = canvas.toDataURL('image/jpeg');
        callback ? callback(dataUrl) : '';
    };
}

// 识别二维码
/**
 * 识别二维码
 * @param {Image} image
 * @param {function (data)} succ_callback 
 * @param {function} error_callback 
 */
function recognizeCaptcha(image_binary, succ_callback) {
    headers = { 'content-type': 'application/json' };
    postData = {
        'image': image_binary
    };
    $.ajax({
        url: "http://127.0.0.1:8/register",
        data: JSON.stringify(postData),
        headers: headers,
        method: 'POST',
        dataType: 'text',
        success: succ_callback,
        error: function (err) {
            console.log(err)
        }
    });
}


function run() {
    var date1 = new Date();  //开始时间  
    //clearInterval(itv_run);
    //running = true;
       
   //date1 = new Date();
    console.log("start!");
    let imgLink = image_url + "&t=" + (new Date).getTime();
    getImgBase64(imgLink, function (dataUrl) {
        if (dataUrl == '') {
            console.log("获取验证码失败");
            //running = false;
            return;
        }
        //let t1 = new Date();
        // console.log(dataUrl.split(',')[1]);
        recognizeCaptcha(dataUrl.split(',')[1],
            function (data) {
                console.log(data);
                let t2 = new Date();
                console.log("截止到识别验证码的时间=" + (t2.getTime() - date1.getTime()).toString());
                console.log(t2.getTime());
                $.ajax({
                    url: "http://tl.cyg.changyou.com/transaction/buy",
                    type: "post",
                    async: !1,
                    data: {
                        goods_serial_num: id,
                        captcha_code: data
                    },
                    success: function (t) {
                        console.log(t);
                        total += 1;
                        var date2 = new Date();
                        console.log(date2.getTime() - date1.getTime());
                        //running = false;
                        if (t != "captcha_error" && t != "captcha_cannot_null") {
                            success += 1;
                            start = false;
                            alert("success! time=" + (date2.getTime() - date1.getTime()).toString() + "ms" + t);
                        }
                        else {
                            //window.location.reload();
                            itv_run = setInterval(() => {
                                clearInterval(itv_run);
                                run();
                                console.log(new Date());
                            }, 10);
                        }
                    }
                });

            });
    });
}


var restTime = parseInt($(".less-than-day").attr("data-second"));
console.log(restTime);
let running = false;
if ($("#buySubmit").length > 0) {
    running = true;
}
var total = 0;
var success = 0;
var start = false;
var location1 = 0;
$.get(window.location.href, function (data, status) {
    location1 = data.indexOf('关注', 10000);
    console.log(location1);
});

let itv_run = setInterval(() => {
    //clearInterval(itv_run);
    //if (start == true) {
    //    run();
    //}
    if (restTime < -1) {
        //window.location.reload();
        running = true;
        clearInterval(itv_run);
    }
}, 10);


let time_count = setInterval(() => {
    restTime = restTime - 0.1;
}, 100);

var count = 0;
let update1 = setInterval(() => {
    if (running == true) {
        running = false;
        //if (count == 0) {
            console.log('time', new Date().getTime(), count);
        //}
        count += 1;
        $.get(window.location.href, function (data, status) {
            //console.log(data[location1 - 97]);
            if (start == false && (data[location1 - 97] == "立" || data[location1 - 96] == "立")) { // data.indexOf("立即购买", 10000) != -1){
                run();
                clearInterval(update1);
                console.log("start buying!");
                console.log(new Date().getTime(), count);
                start = true;
                //running = false;
            }
            else {
                console.log("not", count);
                running = true;
            }
        });
    }
}, 5);

