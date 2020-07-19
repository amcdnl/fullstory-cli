const inquirer = require('inquirer');
const moment = require('moment');
const { runCSVReport } = require('./cli/csv');
const { runJSONReport } = require('./cli/json');
const { argv } = require('yargs')
const { resolve, join } = require('path');

const config = require(resolve(join(process.cwd(), 'story.js')));

inquirer.registerPrompt(
  'datetime',
  require('inquirer-datepicker-prompt')
);

inquirer.prompt([
  {
    type: 'datetime',
    name: 'start',
    message: '📅 What day to start at?',
    format: ['mm', '-', 'dd', '-', 'yyyy'],
    date: {
      min: moment().subtract(90, 'day').startOf('day').toDate(),
      max: moment().startOf('day').toDate()
    },
    initial: moment().subtract(2, 'day').startOf('day').toDate(),
    when(answers) {
      if (argv.offset) {
        console.log(`Using '${argv.offset}' for 'start' from arguments`);
        answers.start = moment().subtract(parseInt(argv.offset), 'day').startOf('day').toDate();
      } else if (argv.start) {
        console.log(`Using '${argv.start}' for 'start' from arguments`);
        answers.start = moment(argv.start, 'yyyy-mm-dd').toDate();
      } else {
        return true;
      }
    }
  },
  {
    type: 'datetime',
    name: 'end',
    message: '📅 What day to end at?',
    format: ['mm', '-', 'dd', '-', 'yyyy'],
    date: {
      min: moment().subtract(90, 'day').startOf('day').toDate(),
      max: moment().startOf('day').toDate()
    },
    initial: moment().toDate(),
    when(answers) {
      if (argv.end) {
        console.log(`Using '${argv.end}' for 'end' from arguments`);
        answers.end = moment(argv.end, 'yyyy-mm-dd').toDate();
      } else {
        return !argv.offset;
      }
    }
  },
  {
    type: 'list',
    message: '💾 What export type?',
    name: 'type',
    choices: [
      {
        name: 'JSON'
      },
      {
        name: 'CSV'
      }
    ],
    when(answers) {
      if (argv.type) {
        console.log(`Using '${argv.type}' for 'type' from arguments`);
        answers.type = argv.type;
      } else {
        return true;
      }
    }
  },
  {
    type: 'confirm',
    message: '🧪  Aggregate data?',
    name: 'aggregate',
    default: true,
    when: function (answers) {
      if (argv.aggregate) {
        console.log(`Using '${argv.aggregate}' for 'aggregate' from arguments`);
        answers.aggregate = argv.aggregate === 'true';
      } else {
        return answers.type === 'JSON';
      }
    }
  },
  {
    type: 'confirm',
    message: '📌 Add headers to CSV?',
    name: 'header',
    default: true,
    when: function (answers) {
      if (argv.header) {
        console.log(`Using '${argv.header}' for 'header' from arguments`);
        answers.header = argv.header === 'true';
      } else {
        return answers.type === 'CSV';
      }
    }
  }
]).then(async (answers) => {
  answers.type === 'JSON' ?
    await runJSONReport(config, answers) :
    await runCSVReport(config, answers);
});
