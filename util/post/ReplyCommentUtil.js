let request = require('request');

function ReplyCommentUtil(commentId, text){

    let config = require('../../config.json');

    this.commentId = commentId;
    this.text = text;
    
    this.setDetail = function(commentId, text) {
        this.commentId = commentId;
        this.text = text;
    }

    this.replyComment = function(commentId, text) {

        this.commentId = commentId ? commentId : this.commentId;
        this.text = text ? text : this.text;

        messageData = {
            text: this.text,
        }
    
        let option = {
            url: 'https://graph.facebook.com/v2.6/' + commentId + '/comments',
            qs: { access_token: config.token },
            method: 'POST',
            json: {
                message: text,
            }
        }
        request(option, function (error, response, body) {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
        });
    };     
}

module.exports = ReplyCommentUtil;