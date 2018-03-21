let config = require('../../config.json');

function PrivateReplies(comment_id, message){
    
    message = {
        text: message
    };
    let option = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: config.token },
        method: 'POST',
        json: true,
        json: {
            recipient: { id: comment_id },
            message: message,
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

module.exports = PrivateReplies;