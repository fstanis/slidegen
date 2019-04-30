#!/usr/bin/env node

// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const fs = require('fs');
const yaml = require('js-yaml');
const commander = require('commander');

const { generateDeck } = require('./src/generate');

commander
  .version('0.1.0')
  .option('-c, --config <filename>', 'Specifies the path to the config file')
  .option('-o, --output [filename]', 'Specifies the output filename (defaults to slides.key)', 'slides.key')
  .parse(process.argv);

async function loadConfig () {
  if (fs.existsSync(commander.output)) {
    throw new Error('Output file already exists.');
  }

  if (!commander.config) {
    throw new Error('Must specify config to use.');
  }

  if (!fs.existsSync(commander.config)) {
    throw new Error('Config file not found.');
  }

  const config = yaml.safeLoad(await fs.promises.readFile(commander.config, 'utf8'));

  if (!Array.isArray(config.videos)) {
    throw new Error('Invalid config file.');
  }

  return config;
}

loadConfig()
  .then(config => generateDeck(config, commander.output))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
