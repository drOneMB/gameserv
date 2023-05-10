const fs = require('fs');

const addZero = (i) => `${i < 10 ? '0' : ''}${i}`

const isNumeric = (n) => {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

const verifyScore = (score, vcode, verify) => {
    const toVerify = (score + vcode + 17) % 1000;
    return toVerify == verify;
}

module.exports = function (app) {

    app.get('/game', function (req, res) {
        // #swagger.tags = ['HighScore']

        /* #swagger.parameters['game'] = {
	        in: 'query',
            description: 'Nazwa gry',
            type: 'string'
        } */
        
        /* #swagger.parameters['score'] = {
	        in: 'query',
            description: 'Wynik gracza',
            type: 'int'
        } */
        
        /* #swagger.parameters['vcode'] = {
	        in: 'query',
            description: 'Dokładna data ukończenia gry',
            type: 'int'
        } */
        
        /* #swagger.parameters['verify'] = {
	        in: 'query',
            description: 'Walidacja wyniku',
            type: 'int'
        } */

        // #swagger.responses[422] = { description: 'Błąd walidacji!' }
        if(!req.query.game || !req.query.score || !req.query.vcode || !req.query.verify)
            return res.status(422).json({
                "error": "game, score, vcode or verify not provided"
            });

        console.log(```
            Received request from ${req.ip}: (game: ${req.query.game}, score: ${req.query.score}, vcode: ${req.query.vcode}, verify: ${req.query.verify})
        ```);

        //check if game is a two letter string
        if (req.query.game.length != 2)
            return res.status(422).json({
                "error": "game must be a two letter string"
            });

        if(["ra"].indexOf(req.query.game?.toLowerCase()) == -1)
            return res.status(422).json({
                "error": "game name not valid"
            });

        if(!isNumeric(req.query.score) || !isNumeric(req.query.vcode) || !isNumeric(req.query.verify))
            return res.status(422).json({
                "error": "score, vcode or verify not numeric"
            });

        //check if score is int, not lfloat
        if (
            req.query.score % 1 != 0 ||
            req.query.vcode % 1 != 0 ||
            req.query.verify % 1 != 0 ||
            req.query.score < 0 ||
            req.query.vcode < 0 ||
            req.query.verify < 0 ||
            req.query.score > 999999999 ||
            req.query.vcode > 999999999 ||
            req.query.verify > 999)
            return res.status(422).json({
                "error": "score, vcode or verify didn't pass validation"
            });
        
        let {game, score, vcode, verify} = req.query;
        score = parseInt(score);
        vcode = parseInt(vcode);
        verify = parseInt(verify);

        //check if score is valid
        if (!verifyScore(score, vcode, verify))
            return res.status(422).json({
                "error": "score, vcode or verify didn't pass validation"
            });

        highScoresDB = JSON.parse(fs.readFileSync('./database/highscores.json'));
        const created_at = new Date();
        const date_string = `${addZero(created_at.getDate())}.${addZero(created_at.getMonth() + 1)}.${created_at.getFullYear()} ${addZero(created_at.getHours())}:${addZero(created_at.getMinutes())}:${addZero(created_at.getSeconds())}`;
        highScoresDB.push({
            created_at: date_string,
            game,
            score,
            vcode
        });
        //sort by score and vcode (score DESC, vcode ASC)
        highScoresDB.sort((a, b) => {
            if (a.score == b.score) {
                return a.vcode - b.vcode;
            }
            return b.score - a.score;
        });
        fs.writeFileSync('./database/highscores.json', JSON.stringify(highScoresDB));

        // #swagger.responses[200] = { description: 'Dodano wynik' }
        return res.status(200).json({
            response: "Success!"
        });
    });
	
    app.get('/score', function (req, res) {
        // #swagger.tags = ['HighScore']

        /* #swagger.parameters['limit'] = {
	        in: 'query',
            description: 'Limit (max 1000)',
            type: 'int'
        } */

        /* #swagger.parameters['offset'] = {
	        in: 'query',
            description: 'Offset',
            type: 'int'
        } */

        if (!req.query.limit) req.query.limit = 1000;
        if(req.query.limit < 0 || req.query.limit > 1000) return res.json({
            "error": "limit must be between 0 and 1000"
        }, 422);

        if (!req.query.offset) req.query.offset = 0;
        if(req.query.offset < 0) return res.json({
            "error": "offset must be greater than 0"
        }, 422);

        highScoresDB = JSON.parse(fs.readFileSync('./database/highscores.json'));
        highScoresDB = highScoresDB.slice(req.query.offset, req.query.offset + req.query.limit);

        // #swagger.responses[200] = { description: 'Pobrano wyniki' }
        return res.status(200).json(highScoresDB);
    });

    app.get('/', function (req, res) {
        // #swagger.tags = ['HighScore']

        // #swagger.responses[200] = { description: 'Witaj!' }
        return res.status(200).json({
            response: "🗿"
        });
    });
}