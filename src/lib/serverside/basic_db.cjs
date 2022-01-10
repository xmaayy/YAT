const electron = require('electron');
const path = require('path');
const fs = require('fs');

class Store {
  constructor(opts) {
    const userDataPath = (electron.app || electron.remote.app).getPath('userData');
    this.path = path.join(userDataPath, opts.configName + '.json');
    this.data = this.parseDataFile(this.path, opts.defaults);
  }
  get(key) {
    return this.data[key];
  }

  set(key, val) {
    this.data[key] = val;
    // I'm not totally sure how to do progressive reads and writes
    // yet so for now we're going to be writing on every set
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }


  parseDataFile(filePath, defaults) {
    try {
      return JSON.parse(fs.readFileSync(filePath));
    } catch (error) {
      return defaults;
    }
  }
}


/*
* History is both the 'database' we're using and how we'll be manipulating the
* data because I'm too lazy to follow proper OO principles
*/
class History {
  constructor(opts) {
    const userDataPath = (electron.app || electron.remote.app).getPath('userData');
    this.path = path.join(userDataPath, opts.configName + '.json');
    this.data = this.parseDataFile([]);
    console.log("Data" + this.data)
    console.log(this.data)
  }

  /*
  * IDK if a pure 'get' function makes sense in this case, because its 
  * unlikely that anyone will ever want just 1 record.
  */
  get(key) {
    return this.data[key];
  }

  add(data) {
    this.data.push(data);
    console.log("basic_db" + JSON.stringify(data))
    fs.appendFileSync(this.path, JSON.stringify(data) + "\n");
  }

  countSessions() {
    return this.data.length;
  }

  heatmap() {
    var new_data = this.data.map(e => {
      var a = new Date(e.start_time);
      return [a.getDay(), a.getHours()]
    })
    var days = [
      { name: 'S', data: Array.from({ length: 24 }, (v, i) => 0) },
      { name: 'M', data: Array.from({ length: 24 }, (v, i) => 0) },
      { name: 'T', data: Array.from({ length: 24 }, (v, i) => 0) },
      { name: 'W', data: Array.from({ length: 24 }, (v, i) => 0) },
      { name: 'T', data: Array.from({ length: 24 }, (v, i) => 0) },
      { name: 'F', data: Array.from({ length: 24 }, (v, i) => 0) },
      { name: 'S', data: Array.from({ length: 24 }, (v, i) => 0) }
    ];
    for (const element of new_data) {
      days[element[0]].data[element[1]] += 1;
    }
    return days;
  }

  getTotalTime() {
    var new_data = this.data.map(e => {
      return Math.round(e.length / 1000 / 60);
    })

    function add(accumulator, a) {
      return accumulator + a;
    }
    return new_data.reduce(add, 0); // with initial value to avoid when the array is empty
  }

  getGraphData() {
    const cumulativeSum = (sum => value => sum += value)(0);
    let mins = this.data.map(e => {
      return Math.round(e.length / 1000 / 60);
    })
    let xaxis = this.data.map(e => {
      return e.start_time;
    })
    mins = mins.map(cumulativeSum);
    return {yaxis:mins, xaxis:xaxis}
  }

  parseDataFile(defaults) {
    try {
      let lines = fs.readFileSync(this.path, { encoding: 'utf8', flag: 'r' }).split('\n');
      // We're reading a JSON Lines file, so just map every line to a JSON file
      return lines.filter(e => e !== '').map(e => {
        return (e === '' ? {} : JSON.parse(e));
      })
    } catch (error) {
      console.log(error)
      return defaults;
    }
  }
}

exports.Store = Store;
exports.History = History;