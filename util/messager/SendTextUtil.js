let request = require('request');

function SendTextUtil() {
    // let config = require('../config.json');

    let config = require('../../config.json');

    this.sendTextMessage = function(sender, message = '') {

        this.sender = sender ? sender : this.sender;
        this.message = message ? message : this.message;
        
        let option = {
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: { access_token: config.token },
            method: 'POST',
            json: true,
            json: {
                recipient: { id: this.sender },
                message,
            }
        }
    
        request(option, function (error, response, body) {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
            return body;
        });
    }

    this.privateReplies = function(comment_id, message){
        console.log('comment_id : ' + comment_id)
        let option = {
            url: 'https://graph.facebook.com/v2.12/' + comment_id + '/private_replies',
            qs: { access_token: config.token },
            method: 'POST',
            json: true,
            json: {
                recipient: { id: comment_id },
                message,
            }
        }
    
        request(option, function (error, response, body) {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
            return body;
        });
    
    
    }
}

module.exports = SendTextUtil;
