'use strict';

const fs = require('fs-extra');
const request = require('request');
const async = require('async');
var admZip = require('adm-zip');
const distPath = __dirname + '/../../../dist';
const uploadsPath = __dirname + '/../../../uploads';
const mockPath = __dirname + '/../../../mockjson';

const downloadFile = function(url, filePath) {
  const fileStream = fs.createWriteStream(filePath);

  fileStream.on('error', function(err) {
    console.log(err);
  });
  try {
    request(url).pipe(fileStream);
  } catch (err) {
    console.log(err);
  }
};

const downloadJson = function(appPath, endpoint, jsonFile, cb) {
  const fileStream = fs.createWriteStream(appPath + '/json/' + jsonFile);

  fileStream.on('error', function(err) {
    console.log(err);
  });
  fileStream.on('finish', function () {
    cb()
  });

  try {
    console.log('Downloading ' + endpoint + '/' + jsonFile);
    request
        .get(endpoint + '/' + jsonFile)
        .on('response', function(response) {
          if (response.statusCode != 200) {
            cb(new Error('Response = ' + response.statusCode + 'received'));
          } else {
            console.log('Got response');
            console.log(response.statusCode); // 200
            console.log(response.headers['content-type']); // 'image/png'
          }
        })
        .pipe(fileStream);
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  distPath: distPath,
  cleanUploads: function(err) {
    fs.emptyDir(uploadsPath, err);
  },
  cleanDist: function(appFolder, err) {
    fs.emptyDir(distPath + '/' + appFolder, (emptyErr) => {
      if(emptyErr)
         return err(emptyErr);
      fs.remove(distPath + '/' + appFolder, err);
    });
  },
  makeDistDir: function(appFolder, err) {
    const appPath = distPath + '/' + appFolder;
    fs.mkdirpSync(distPath);
    fs.mkdirpSync(appPath);
    fs.mkdirpSync(appPath + '/audio');
    fs.mkdirpSync(appPath + '/images/speakers');
    fs.mkdirpSync(appPath + '/images/sponsors');
  },
  copyAssets: function(appFolder, err) {
    const appPath = distPath + '/' + appFolder;
    fs.copy((__dirname + '/assets'), appPath, {clobber: true}, err);
  },
  copyUploads: function(appFolder, uploadedFile) {
    const appPath = distPath + '/' + appFolder;
    fs.mkdirpSync(appPath + '/json');
    var zip = new admZip(uploadedFile);
     var zipEntries = zip.getEntries(); 

     zipEntries.forEach(function(zipEntry) {
     
      switch(zipEntry.entryName){
        case 'images/speakers/':
        zip.extractEntryTo("images/speakers/", appPath ); 
        break;
        case 'images/sponsors/':
        zip.extractEntryTo("images/sponsors/", appPath ); 
        break;
        case 'audio/':
        zip.extractEntryTo("audio/", appPath);
        break;
        case 'sessions':
        zip.extractEntryTo("sessions", appPath +'/json/');
        break;
        case 'speakers':
        zip.extractEntryTo("speakers", appPath +'/json/');
        break;
        case 'microlocations' :
        zip.extractEntryTo("microlocations", appPath+'/json/');
        break;
        case 'event' :
        zip.extractEntryTo("event", appPath +'/json/');
        break;
        case 'sponsors' :
        zip.extractEntryTo("sponsors", appPath +'/json/');
        break;
        case 'tracks':
        zip.extractEntryTo("tracks", appPath +'/json/');
        break;
        default:
      }
  
      
    });
    
  },
  fetchApiJsons: function(appFolder, apiEndpoint, done) {
    const endpoint = apiEndpoint.replace(/\/$/, '');
    const appPath = distPath + '/' + appFolder;

    const jsons = [
      'speakers',
      'sponsors',
      'sessions',
      'tracks',
      'microlocations',
      'event'
    ];

    fs.mkdirpSync(appPath + '/json');
    async.eachSeries(jsons, (json, callback) => {
      downloadJson(appPath, endpoint, json, callback);
    }, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Jsons downloaded');
        done();
      }
    });
  },
  copyMockJsons: function(appFolder) {
    const appPath = distPath + '/' + appFolder;
    fs.mkdirpSync(appPath + '/json');
    fs.copySync(mockPath + '/speakers', appPath + '/json/speakers');
    fs.copySync(mockPath + '/sessions', appPath + '/json/sessions');
    fs.copySync(mockPath + '/tracks', appPath + '/json/tracks');
    fs.copySync(mockPath + '/event', appPath + '/json/event');
    fs.copySync(mockPath + '/sponsors', appPath + '/json/sponsors');
    fs.copySync(mockPath + '/microlocations', appPath + '/json/microlocations');
  },
  downloadAudio: function(appFolder, audioUrl) {
    const appPath = distPath + '/' +appFolder;
    const audioFileName = audioUrl.split('/').pop();
    const audioFilePath = 'audio/' + audioFileName;

    console.log('Downloading audio : ' + audioFileName);

    downloadFile(audioUrl, appPath + '/' + audioFilePath);
    return audioFilePath;
  },
  downloadSpeakerPhoto: function(appFolder, photoUrl) {
    const appPath = distPath + '/' +appFolder;
    const photoFileName = photoUrl.split('/').pop();
    const photoFilePath = 'images/speakers/' + photoFileName;

    console.log('Downloading photo : ' + photoUrl + " to " + photoFilePath);
    downloadFile(photoUrl, appPath + '/' + photoFilePath);
    return photoFilePath;
  },
  downloadLogo: function(appFolder, logoUrl) {
    const appPath = distPath + '/' +appFolder;
    const photoFileName = logoUrl.split('/').pop();
    const photoFilePath = 'images/' + photoFileName;

    console.log('Downloading logo : ' + photoFileName);
    downloadFile(logoUrl, appPath + '/' + photoFilePath);
    return photoFilePath;
  },
   downloadSponsorPhoto: function(appFolder, photoUrl) {
    const appPath = distPath + '/' +appFolder;
    const photoFileName = photoUrl.split('/').pop();
    const photoFilePath = 'images/sponsors/' + photoFileName;

     console.log('Downloading photo : ' + photoUrl + " to " + photoFilePath);
    downloadFile(photoUrl, appPath + '/' + photoFilePath);
    return photoFilePath;
  }
};
