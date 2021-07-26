const Discord = require("discord.js");
const fs = require('fs');
const client = new Discord.Client();
require('dotenv-flow').config();
const disctoken = process.env.TOKEN;
const prefix = process.env.PREFIX;
const path = require('path');

//badly scoped variables
var matchID = 1;
const users = [];
const matches = [];
const bets = [];
const predicts = [];
var switchOpen = false;


client.on("ready", () => {
  console.log("SPHBetting online");
});


//check for prefix and channel id
client.on("message", (message) => {
    if (message.channel.id == '840105043931168770') {
        if (message.content.startsWith(prefix)) {
            if (message.member.id == '325912511859916800') {
                staffCommands(message);
            }
            userCommands(message);
        }
    }
});
   
/*
 * STAFF COMMANDS AND FUNCTIONS
 */
function staffCommands(message) {
    var args = message.content.substring(prefix.length).split(" ");
    switch (args[0]) {
        case "add":
            addMatch(message);
            message.reply(`add complete`)
            break;
        case "remove":
            removeMatch(message);
            message.reply(`remove complete`)
            break;
        case "pay":
            payUser(message)
            message.reply(`pay complete`)
            break;
        case "odds":
            setOdds(message)
            message.reply(`odds complete`)
            break;
        case "result":
            setResult(message)
            message.reply(`results complete`)
            break;
        case "switch":
            switchOpen = (switchOpen) ? false : true
            message.reply(`betting: ${switchOpen}`)
            break
        case "save":
            saveData(message);
            message.reply(`data saved!`)
            break
        case "load":
            loadData(message);
            message.reply(`data loaded!`)
            break
        case "setMatch":
            setMatchID(message);
            break;
    }
}

function saveData(message) {
    fs.writeFile("users.txt", JSON.stringify(users), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("File saved");
        }
    });

    fs.writeFile("matches.txt", JSON.stringify(matches), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("File saved");
        }
    });

    fs.writeFile("bets.txt", JSON.stringify(bets), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("File saved");
        }
    });

    fs.writeFile("predicts.txt", JSON.stringify(predicts), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("File saved");
        }
    });
}

function loadData(message) {
    var normalPath = path.normalize(__dirname + '/users.txt');
    const userFile = fs.readFileSync(normalPath, 'utf8');
    var userData = JSON.parse(userFile);
    for (const obj of userData) {
        users.push(obj);
    }

    normalPath = path.normalize(__dirname + '/matches.txt');
    const matchesFile = fs.readFileSync(normalPath, 'utf8');
    var matchData = JSON.parse(matchesFile);
    for (const obj of matchData) {
        matches.push(obj);
    }

    normalPath = path.normalize(__dirname + '/bets.txt');
    const betsFile = fs.readFileSync(normalPath, 'utf8');
    var betsData = JSON.parse(betsFile);
    for (const obj of betsData) {
        bets.push(obj);
    }

    normalPath = path.normalize(__dirname + '/predicts.txt');
    const predictsFile = fs.readFileSync(normalPath, 'utf8');
    var predictData = JSON.parse(predictsFile);
    for (const obj of predictData) {
        predicts.push(obj);
    }
}


function setMatchID(message) {
    var args = message.content.substring(prefix.length).replace(/  +/g, ' ').split(" ");
    matchID = parseInt(args[1])
    message.reply (`set matchID to ${matchID}`)
}

function addMatch(message) {
    //USAGE: !add [string: team one] [string: team two]
    var args = message.content.substring(prefix.length).replace(/  +/g, ' ').split(" ");
    var newMatch = { "id": parseInt(matchID), "teamOne": args[1], "teamTwo": args[2] };
    matches.push(newMatch);
    matchID += 1;
    console.log(matches);
}

function removeMatch(message) {
    //USAGE: !remove [integer: matchID]
    //later might be good to void bets/predictions
    //but not necessary now since i have control over these
    var args = message.content.substring(prefix.length).replace(/  +/g, ' ').split(" ");

    if (matches.some(e => e.id == parseInt(args[1]))) {
        var objIndex = matches.findIndex((e => e.id == args[1]))
        matches.splice(objIndex, 1)
        message.reply(`removed match`);
    } else {
        message.reply(`matchID not found`);
    }

}

function payUser(message) {
    //USAGE: !pay [@mention] [integer: amount]

    //need argument checks
    var args = message.content.substring(prefix.length).replace(/  +/g, ' ').split(" ");
    const employee = getUserFromMention(args[1]);

    //check if user exists
    if (users.some(e => e.id == employee.id)) {
        //disburse payment
        var objIndex = users.findIndex((e => e.id == employee.id))
        users[objIndex].money += parseInt(args[2]);
        users[objIndex].jobIncome += parseInt(args[2]);
        message.reply(`paying ${args[1]} ${args[2]}`)
    } else {
        message.reply(`user doesn't exist`)
    }
}

//helper function for pay, returns user object from a mention
function getUserFromMention(mention) {
    if (!mention) return;

    if (mention.startsWith('<@') && mention.endsWith('>')) {
        mention = mention.slice(2, -1);

        if (mention.startsWith('!')) {
            mention = mention.slice(1);
        }

        return client.users.cache.get(mention);
    }
}


function setOdds(message) {
    //USAGE: !setOdds [integer: matchID] [integer: oddsOne] [integer: oddsTwo]
    var args = message.content.substring(prefix.length).replace(/  +/g, ' ').split(" ");

    //checking if args are valid
    if (!matches.some(e => e.id == args[1])) {
        message.reply(`matchID not found`)
        return
    }
    if (args[2] > -100 && args[2] < 100) {
        message.reply(`odds must be less than -100 or greater than 100`)
        return
    }
    if (args[3] > -100 && args[3] < 100) {
        message.reply(`odds must be less than -100 or greater than 100`)
        return
    }

    var objIndex = matches.findIndex((e => e.id == args[1]))
    matches[objIndex].oddsOne = parseInt(args[2])
    matches[objIndex].oddsTwo = parseInt(args[3])
}


function setResult(message) {
    //USAGE: !result [integer: matchID] [integer: result]
    //check args
    var args = message.content.substring(prefix.length).replace(/  +/g, ' ').split(" ");

    if (!matches.some(e => e.id == args[1])) {
        message.reply(`matchID not found`)
    }
    //check all predicts and bets, resolve them
    const resolveP = predicts.filter(e => e.mid == args[1]);
    const resolveB = bets.filter(e => e.mid == args[1]);
    resolveP.forEach(e => resolvePredict(e, args[2]))
    resolveB.forEach(e => resolveBet(e, args[2]))

    var objIndex = matches.findIndex((e => e.id == args[1]))
    matches.splice(objIndex, 1)
}

function resolveBet(bet, result) {
    var matchIndex = matches.findIndex((e => e.id == bet.mid))
    var objIndex = users.findIndex((e => e.id == bet.userid))
    var betOdds

    if (result == 1) {
        betOdds = matches[matchIndex].oddsOne
    } else {
        betOdds = matches[matchIndex].oddsTwo
    }

    if (result == bet.result) {
        //update betMade, update money based on odds
        var winnings = calculateWinnings(bet.wager, betOdds)
        users[objIndex].betCorrect += 1
        users[objIndex].money += winnings
        users[objIndex].amountWon += winnings
    }

    //remove bet from table
    objIndex = bets.findIndex((e => e.id == bets.userid && e.mid == bets.mid));
    bets.splice(objIndex, 1)

}

function calculateWinnings(wager, odds) {
    if (odds > 99) {
        //positive odds function
        return Math.floor(wager * (1 + (odds/100)))
    } else if (odds < -99) {
        //negative odds function
        return Math.floor(wager * (1 - (100/odds)))
    } else {
        console.log(`there was an error with the odds`)
    }
}

function resolvePredict(predict, result) {
    var objIndex = users.findIndex((e => e.id == predict.userid));
    if (result == predict.result) {
        users[objIndex].money += 100
        users[objIndex].predictCorrect += 1
    }

    objIndex = predicts.findIndex((e => e.id == predict.userid && e.mid == predict.mid));
    predicts.splice(objIndex,1)

}


/*
 * GENERAL USER COMMANDS
 */
function userCommands(message) {
    var args = message.content.substring(prefix.length).split(" ");
    switch (args[0]) {
        case "register":
            registerUser(message);
            break;
        case "list":
            list(message);
            break;
        case "bet":
            addBet(message);
            break;
        case "predict":
            addPredict(message);
            break;
        case "info":
            info(message);
            break;
        case "lb":
            displayLeaderboard(message);
            break;
        case "me":
            me(message)
            break;
        case "rename":
            renameUser(message)
            break;
        default:
            break;
    }
}

function displayLeaderboard(message) {
    var args = message.content.substring(prefix.length).replace(/  +/g, ' ').split(" ");

    if (args[1] == 'bet') {
        lbMoney(message);
        return
    } else if (args[1] == 'predict') {
        lbPredict(message);
    } else {
        message.reply(`must specify either !lb bet or !lb predict`)
    }
}

function lbMoney(message) {
    var lbLength = (users.length > 20) ? 20 : users.length

    var infoUser = ''
    var infoScore = ''

    users.sort((a, b) => parseInt(b.money) - parseInt(a.money));

    for (var i = 0; i < lbLength; i++) {
        infoUser += `\`${users[i].name}\`\n`;
        infoScore += `\`${users[i].money}\`\n`
    }

    const exampleEmbed = {
        color: 0x0099ff,
        title: 'Total Money Leaderboard',
        fields: [
            {
                name: 'Username',
                value: infoUser,
                inline: true,
            },
            {
                name: "Total Money",
                value: infoScore,
                inline: true,
            },

        ],
        timestamp: new Date(),
        footer: {
            text: 'To see current leaderboard based on correct predictions, type !lb predict'
        }
    };

    message.channel.send({ embed: exampleEmbed });

}

function lbPredict(message) {
    var lbLength = (users.length > 20) ? 20 : users.length

    var infoUser = ''
    var infoScore = ''

    users.sort((a, b) => parseInt(b.predictCorrect) - parseInt(a.predictCorrect));

    for (var i = 0; i < lbLength; i++) {
        infoUser += `\`${users[i].name}\`\n`;
        infoScore += `\`${users[i].predictCorrect}\`\n`
    }

    const exampleEmbed = {
        color: 0x0099ff,
        title: 'Predictions Leaderboard',
        fields: [
            {
                name: 'Username',
                value: infoUser,
                inline: true,
            },
            {
                name: "Correct Predictions",
                value: infoScore,
                inline: true,
            },

        ],
        timestamp: new Date(),
        footer: {
            text: 'To see current leaderboard based on total money, type !lb bet'
        }
    };

    message.channel.send({ embed: exampleEmbed });

}

function renameUser(message) {
    var args = message.content.substring(prefix.length).replace(/  +/g, ' ').split(" ");
    if (!users.some(e => e.id == message.author.id)) {
        message.reply(`user doesn't exist`)
        return
    }
    if (args.length == 1) {
        message.reply(`rename yourself to what?`)
        return
    }
    if (args[1].length > 15 || args[1].length < 1) {
        message.reply(`name must be between 1 and 15 characters`)
        return
    }
    var objIndex = users.findIndex((obj => obj.id == message.author.id));
    users[objIndex].name = args[1]
    message.reply(`renamed user to ${args[1]}`)
}

function registerUser(message) {
    var newUser =
    {
        "name": message.author.username,
        "id": message.author.id,
        "money": 1000,
        "jobIncome": 0,
        "predictMade": 0,
        "predictCorrect": 0,
        "betMade": 0,
        "betCorrect": 0,
        "amountWagered": 0,
        "amountWon": 0,
    }
    if (users.some(e => e.id == message.author.id)) {
        message.reply("user already exists!")
    } else {
        users.push(newUser);
        message.reply("user created.  you have been started with $1,000")
    }
}


function list(message) {
    var matchIds = '';
    var teamOnes = '';
    var teamTwos = '';

    for (const element of matches) {
        matchIds += `\`${element.id}\`\n`;
        teamOnes += `\`${element.teamOne} (${(element.oddsOne < 0 ? "" : "+") + element.oddsOne})\`\n`;
        teamTwos += `\`${element.teamTwo} (${(element.oddsTwo < 0 ? "" : "+") + element.oddsTwo})\`\n`;
    }

    if (matchIds == '') {
        message.reply(`no open matches!`)
        return
    }

    const exampleEmbed = {
        color: 0x0099ff,
        title: 'Open Matches',
        description: `To make a bet or prediction, use !bet [MatchID] [1 or 2] [amount to wager] or !predict [MatchID] [1 or 2].`,
        fields: [
            {
                name: "Odds",
                value: 'The odds for favorites are accompanied by a minus (-) sign, indicating the amount you need to stake to win $100. Meanwhile, the odds for underdogs are accompanied by a positive (+) sign, indicating the amount won for every $100 staked.'
            },
            {
                name: 'ID',
                value: matchIds,
                inline: true,
            },
            {
                name: "Team One",
                value: teamOnes,
                inline: true,
            },
            {
                name: 'Team Two',
                value: teamTwos,
                inline: true,
            },
        ],
        timestamp: new Date(),
    };

    message.channel.send({ embed: exampleEmbed });
}

function me(message) {
    var args = message.content.substring(prefix.length).replace(/  +/g, ' ').split(" ");
    var userID = message.author.id
    if (!users.some(e => e.id == userID)) {
        message.reply(`user doesn't exist`)
        return
    }
    var matchIds = '';
    var teamWin = '';
    var wagers = '';


    if (args[1] == 'bet') {
        if (!bets.some(e => e.userid == message.author.id)) {
            message.reply(`you have no bets out`)
            return
        }
        const resolve = bets.filter(e => e.userid == message.author.id)
        for (const element of resolve) {
            var matchIndex = matches.findIndex((e => e.id == element.mid))
            matchIds += `\`${element.mid}\`\n`;
            teamWin += `\`${element.result == 1 ? matches[matchIndex].teamOne : matches[matchIndex].teamTwo}\`\n`;
            wagers += `\`${element.wager}\`\n`;
        }

        //iterate over items
    } else if (args[1] == 'predict') {
        if (!predicts.some(e => e.userid == message.author.id)) {
            message.reply(`you have no predictions out`)
            return
        }
        const resolve = predicts.filter(e => e.userid == message.author.id)
        for (const element of resolve) {
            var matchIndex = matches.findIndex((e => e.id == element.mid))
            matchIds += `\`${element.mid}\`\n`;
            teamWin += `\`${element.result == 1 ? matches[matchIndex].teamOne : matches[matchIndex].teamTwo}\`\n`;
            wagers += `\`N/A\`\n`;

        }
    } else {
        message.reply(`incorrect command usage.  use either !me bet or !me predict`)
    }


    const exampleEmbed = {
        color: 0x0099ff,
        title: `Current ${args[1]}s`,
        fields: [
            {
                name: 'Match Id',
                value: matchIds,
                inline: true,
            },
            {
                name: "Team To Win",
                value: teamWin,
                inline: true,
            },
            {
                name: "Wager",
                value: wagers,
                inline: true,
            },

        ],
        timestamp: new Date(),
    };

    message.channel.send({ embed: exampleEmbed });

}

function info(message) {
    //USAGE: !info [@mention]
    //note: if there's no argument, we would use message.author.id

    var args = message.content.substring(prefix.length).replace(/  +/g, ' ').split(" ");
    var userID = message.author.id
    var infoFields = ''
    var infoValues = '' 
    if (args[1]) {
        userID = getUserFromMention(args[1])
        infoName = args[1]
    }
    if (!users.some(e => e.id == userID)) {
        message.reply(`user doesn't exist`)
        return
    }
    var objIndex = users.findIndex((obj => obj.id == userID));
    for (const property in users[objIndex]) {
        infoFields += `\`${property}\`\n`;
        infoValues += `\`${users[objIndex][property]}\`\n`
    }
    const exampleEmbed = {
        color: 0x0099ff,
        title: users[objIndex].name,
        fields: [
            {
                name: 'Field',
                value: infoFields,
                inline: true,
            },
            {
                name: "Value",
                value: infoValues,
                inline: true,
            },

        ],
        timestamp: new Date(),
        footer: {
            text: 'To see your current predictions/bets, type !me [predict or bet]'
        }
    };

    message.channel.send({ embed: exampleEmbed });

}

function addBet(message) {
    //USAGE: !bet [matchID] [teamToWin] [wager]
    //helper for args
    var args = message.content.substring(prefix.length).replace(/  +/g, ' ').split(" ");
    var wager = parseInt(args[3])

    //checking if args are valid
    if (!switchOpen) {
        message.reply(`betting is currently closed`)
        return
    }
    if (!users.some(e => e.id == message.author.id)) {
        message.reply(`user doesn't exist, please register`)
        return
    }
    if (!matches.some(e => e.id == args[1])) {
        message.reply(`matchid doesn't exist`)
        return
    }
    var res = parseInt(args[2])
    if (res < 1 || res > 2 || !Number.isInteger(res)) {
        message.reply(`you must predict either team one or team two to win`)
        return
    }
    if (wager < 1 || !Number.isInteger(wager)) {
        message.reply(`your wager must be greater than 0`)
        return
    }


    //user has enough money
    var objIndex = users.findIndex((obj => obj.id == message.author.id));
    if (users[objIndex].money < wager) {
        message.reply(`you don't have enough money to make this bet`)
        return;
    }

    var newBet = { "userid": message.author.id, "mid": args[1], "result": args[2], "wager": wager }
    users[objIndex].betMade += 1;
    users[objIndex].money -= wager;
    users[objIndex].amountWagered += wager;
    bets.push(newBet);
    message.reply(`added new bet`)
}

function addPredict(message) {
    //USAGE: !predict [matchID] [teamToWin]
    //helper for args
    var args = message.content.substring(prefix.length).replace(/  +/g, ' ').split(" ");

    //checking args are valid
    if (!switchOpen) {
        message.reply(`betting is currently closed`)
        return
    }
    if (!users.some(e => e.id == message.author.id)) {
        message.reply(`user doesn't exist, please register`)
        return
    }
    if (!matches.some(e => e.id == args[1])) {
        message.reply(`matchid doesn't exist`)
        return
    }
    var res = parseInt(args[2])
    if (res < 1 || res > 2 || !Number.isInteger(res)) {
        message.reply(`you must predict either team one or team two to win`)
        return
    }

    //update prediction if prediction is already made
    if (predicts.some(e => e.userid == message.author.id && e.mid == args[1])) {
        var objIndex = predicts.findIndex((e => e.userid == message.author.id && e.mid == args[1]));
        predicts[objIndex].result = args[2];
        message.reply(`user has updated prediction`)
        return
    }

    //add prediction if prediction is new
    var newPredict = { "userid": message.author.id, "mid": args[1], "result": args[2] }
    var objIndex = users.findIndex((e => e.id == message.author.id));
    users[objIndex].predictMade += 1
    predicts.push(newPredict)
    message.reply(`user has made new prediction`)
}


client.login(disctoken);