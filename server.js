// let http = require("http");

let express = require('express');
let app = express();
let request = require('request');
let ejs = require('ejs');
let config = require('./config.json');
let sendTextUtil = require('./util/messager/SendTextUtil')
let replyCommentUtil = require('./util/post/ReplyCommentUtil');


app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.get("/", function (req, res) {
    
})

app.get("/webhook", function (req, res) {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'xxxx') {
        console.log('server is connect');
        res.send(req.query['hub.challenge']);
    } else {
        console.error('Failed validation. Make sure the validation tokens match.');
        res.sendStatus(403);
    }
})

app.post("/webhook", function (req, res) {
    console.log(req.body);
    
    if (req.body.entry[0].changes) {
        console.log(req.body.entry[0].changes)
        
        if(req.body.entry[0].changes[0].field === 'feed'){
            
            let item = req.body.entry[0].changes[0].value.item;
            let verb = req.body.entry[0].changes[0].value.verb;

            // catch 留言
            if (item === 'comment' && verb === 'add'){
                let sender = req.body.entry[0].changes[0].value.from.id;
                if (sender !== config.myId) {

                    // 選擇 post id
                    let postId = req.body.entry[0].changes[0].value.post_id;
                    let receiveMessage = req.body.entry[0].changes[0].value.message;
                    if (postId == '204682013612329_216981059049091') {

                        // 搜尋學校名稱
                        getSchoolMajor(receiveMessage, function(getCareerRet){
                            
                            let replyComment;
                            if (!getCareerRet.ITEM) {
                                // replyComment = "沒有這個學校或科系哦～";
            
                                // 私訊回覆
                                // let messageData = {
                                //     text: replyComment,
                                // };
                                // new sendTextUtil().sendTextMessage(sender, messageData);
                            } else {
                                let schoolName = getCareerRet.ITEM[0].TEXT
                                let score = Math.floor(getCareerRet.ITEM[0].SCORE * 100) || 0
            
                                // 分數過濾
                                if (0 <= score && score <= 10){
                                    // replyComment = '你要問\"' + schoolName + '\"嗎?';
                                    return;
                                }
                                if (11 <= score){
                                    replyComment = '你要問\"' + schoolName + '\"嗎?';
                                }
                                // replyComment = '你要問\"' + schoolName + '\"嗎?';

                                // 搜尋就業地圖
                                let sid = getCareerRet.ITEM[0].SID || ''
                                let mid = getCareerRet.ITEM[0].MID || '' 
                                let limit = 3;
                                getCareer(sid, mid, degree, limit ,function(workList){
                                    replyComment += "\n\n新鮮人第一份工作TOP3:\n"
            
                                    let workListMessage = ''
                                    for (let index in workList) {
                                        if (workList[index].jobcatName != '') {
                                            workListMessage += (+index + 1) + '. ' + workList[index].jobcatName + '  ' +  workList[index].jcnt + '%\n'
                                        } else {
                                            break;
                                        }
                                    }
            
                                    // 判斷工作列表是否為空
                                    if (workListMessage == ''){
                                        workListMessage = "查無資料QAQ";
                                    } 
                                    replyComment += workListMessage
            
                                    // 付上就業地圖連結
                                    let careerURL
                                    if (sid && mid) {
                                        careerURL = 'https://www.104.com.tw/jb/career/department/view?sid=' + sid + '&mid=' + mid ;
                                        if (degree == 2) {
                                            careerURL += '&degree=2'
                                        }
                                    } else {
                                        careerURL = 'https://www.104.com.tw/jb/career'
                                    }
                                    replyComment += '\n\n想知道更多?\n來看看104升學就業地圖吧~\n' + careerURL
                                    
                                    let commentId = req.body.entry[0].changes[0].value.comment_id;
                                    // 留言回覆
                                    new replyCommentUtil().replyComment(commentId, replyComment);
                                }) 
                                
                            }
                        });
                        
                    }
                    if (postId == '204682013612329_217355982344932') {

                        let commentId = req.body.entry[0].changes[0].value.comment_id;
                        if (receiveMessage && receiveMessage.indexOf('+1') >= 0) {

                            // 留言回覆
                            let replyComment = '那我就偷偷告訴你 <3';
                            new replyCommentUtil().replyComment(commentId, replyComment);
                            
                            // 私訊回覆
                            let sendMessage = "想知道？告訴我學校名稱和科系我就跟你說 =目\n e.g. 輔仁大學英文系、台北科大資工系"
                            new sendTextUtil().privateReplies(commentId, sendMessage);
                        } else {
                            let replyComment = '看來你沒興趣啊....';
                            new replyCommentUtil().replyComment(commentId, replyComment);
                        }
                    }
                    
                }
            }

            // catch 按讚(含表情)
            // if (item === 'reaction' && (verb === 'add' || verb === 'edit')) {
            //     let sender = req.body.entry[0].changes[0].value.from.id;
            //     let reaction_type = req.body.entry[0].changes[0].value.reaction_type;
            //     console.log(req.body.entry[0].changes[0].value.from)
            //     console.log(sender + ' : ' + reaction_type + '!')
            // }
        }
    } 

    // messager 
    if (req.body.entry[0].messaging) {
        console.log(req.body.entry[0].messaging);
        let sender = req.body.entry[0].messaging[0].sender.id
        
        // 正常回覆
        if (req.body.entry[0].messaging[0].message) {
            let receiveMessage = req.body.entry[0].messaging[0].message.text

            // 搜尋學校名稱
            getSchoolMajor(receiveMessage, function(chk, getCareerRet){
                            
                let replyComment;
                if (getCareerRet.length === 0 || chk != '學校科系皆有') {
                    // replyComment = "沒有這個學校或科系哦～";

                    // 私訊回覆
                    // let messageData = {
                    //     text: replyComment,
                    // };
                    // new sendTextUtil().sendTextMessage(sender, messageData);

                    let chkMessage = ''
                    if (!chk) return;
                    if (chk == '有學校無科系') {
                        chkMessage = '你似乎沒輸入科系或該學校沒有這科系喔'
                    }
                    if (chk == '有科系無學校') {
                        chkMessage = '你似乎沒輸入學校喔'
                    }
                    if (chk == '學校科系皆有') {
                        chkMessage = '你輸入的學校似乎沒這科系喔'
                    }
                    
                    let messageData = {
                        text: chkMessage,
                    };
                    new sendTextUtil().sendTextMessage(sender, messageData);
                    return;
                } else {

                    let schoolName = getCareerRet.TEXT
                    let score = Math.floor(getCareerRet.SCORE * 100) || 0

                    // 分數過濾
                    // if (0 <= score && score <= 10){
                        // replyComment = '你要問\"' + schoolName + '\"嗎?';
                    //     return;
                    // }
                    // if (11 <= score){
                    //     replyComment = '你要問\"' + schoolName + '\"嗎?';
                    // }
                    replyComment = '你要問\"' + schoolName + '\"嗎?';

                    // 搜尋就業地圖
                    let sid = getCareerRet.SID || ''
                    let mid = getCareerRet.MID || '' 
                    let degree = getCareerRet.DEGREE; 
                    let limit = 3;
                    getCareer(sid, mid, degree, limit ,function(workList){

                        // 排版輸出資料
                        replyComment += "\n\n新鮮人第一份工作TOP" + limit + ":\n"

                        // 將工作列表排版
                        let workListMessage = ''
                        for (let index in workList) {
                            if (workList[index].jobcatName != '') {
                                workListMessage += (+index + 1) + '. ' + workList[index].jobcatName + '  ' +  workList[index].jcnt + '%\n'
                            } else {
                                break;
                            }
                        }

                        // 判斷工作列表是否為空
                        let workListIsEmpty = false;
                        if (!workListMessage){
                            workListMessage = "查無資料QAQ\n";
                            workListIsEmpty = true
                        } 
                        replyComment += workListMessage

                        // 附上就業地圖連結
                        let careerURL;
                        if (sid && mid && !workListIsEmpty) {
                            careerURL = 'https://www.104.com.tw/jb/career/department/view?sid=' + sid + '&mid=' + mid ;
                            if (degree == 2) {
                                careerURL += '&degree=2'
                            }
                        } else {
                            careerURL = 'https://www.104.com.tw/jb/career'
                        }
                        replyComment += '\n想知道更多?\n來看看104升學就業地圖吧~\n' + careerURL

                        // 私訊
                        let messageData = {
                            text: replyComment,
                        };
                        new sendTextUtil().sendTextMessage(sender, messageData);
                    }) 
                    
                }
            });
            
        }

        // post back
        // if (req.body.entry[0].messaging[0].postback) {
        //     let receivePostback = req.body.entry[0].messaging[0].postback.title
        // }
        
    }
    
    res.sendStatus(200);

})

function getSchoolMajor(kw, callback) {
    let option = {
        url: 'http://www.104.com.tw/jb/104i/suggest/schoolMajor?',
        qs: { 
            type: 1,
            kw,
            count:10,
        },
        method: 'GET',
        json: true,
    }

    request(option, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }

        let chk = body.LIST_attr.CHK || '';

        let recordcount = body.LIST_attr.RECORDCOUNT || 0;
        
        let callbackItem = []; 
        for (let item of body.LIST.ITEM) {
            console.log(item);
            if (item.SID && item.MID && item.TYPE == "學校科系") {
                callbackItem = item;
                break;
            }
        }

        callback(chk, callbackItem)
    });
}

function getCareer(sid, mid, degree, limit, callback) {
    let option = {
        url: 'http://www.104.com.tw/jb/104i/careerapi/workMap',
        qs: { 
            sid,
            mid,
            degree,
        },
        method: 'GET',
        json: true,
    }

    request(option, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
        let rookieJob = body[1]
        let retList = []
        if (rookieJob){
            for (let i = 1 ; i <= limit ; i++) {

                let jobcatName = 'JOBCATNAME' + i
                let jcnt = 'JCNT' + i 
                retList.push({
                    jobcatName : rookieJob[jobcatName],
                    jcnt : rookieJob[jcnt], 
                })
            }
        }
            
        callback(retList)
    });
}

app.listen(8888);