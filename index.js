const express = require('express');
const bodyParser = require('body-parser');
const wowweemip = require('wowweemip');

const PORT = process.env.PORT || 3000;

const mipFinder = new wowweemip.Finder();
const app = express();
let robot;

app.use(bodyParser.urlencoded({extended: false}));

app.post('/message', (req, res, next) => {
  const message = req.body.Body.trim().toLowerCase();
  res.type('text/xml').send('<Response></Response>');

  controlRobot(message);
});

app.post('/call', (req, res, next) => {
  res.type('text/xml').send(`
  <Response>
    <Gather numDigits="1"></Gather>
    <Redirect>/call</Redirect>
  </Response>`);
  
  const digits = req.body.Digits;
  if (digits) {
    let message;
    switch (digits) {
      case '2':
        message = 'forward';
        break;
      case '8':
        message = 'backward';
        break;
      case '4':
        message = 'left';
        break;
      case '6':
        message = 'right';
        break;
      case '*':
        message = 'fallover';
        break;
      case '5':
      default:
        message = 'sing';
        break;
    }

    controlRobot(message);
  }
});

mipFinder.scan((err, robots) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  robot = robots[0];

  mipFinder.connect(robot, err => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    robot.setMipChestLedWithColor(255, 0, 0);

    app.listen(PORT, () => {
      console.log(`Listening on PORT ${PORT}`);
    });
  });
});

function controlRobot(message) {
  if (message.startsWith('forward')) {
    robot.driveDistanceByCm(20, 0, () => {
      console.log('⬆');
    });
  } else if (message.startsWith('backward')) {
    robot.driveDistanceByCm(-20, 0, () => {
      console.log('⬇');
    });
  } else if (message.startsWith('left')) {
    robot.punchLeftWithSpeed(5, () => {
      console.log('⬅');
    });
  } else if (message.startsWith('right')) {
    robot.punchRightWithSpeed(5, 0, () => {
      console.log('➡');
    });
  } else if (message.startsWith('fallover')) {
    robot.falloverWithStyle('ON_BACK', () => {
      console.log('Bye');
    });
  } else if (message.startsWith('get up')) {
    robot.sendMiPCommand('GET_UP_FROM_POSITION', robot.CONSTANTS['POSITION_VALUE']['ON_BACK'], 0, () => {
      console.log('Get Up');
    });
  } else {
    robot.playMipSound('MIP_SINGING', 0, -1, () => {
      console.log('🔊');
    })
  }
}