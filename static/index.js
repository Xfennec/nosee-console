// TODO:
// - inform users when we've lost connection? (i want to tackle the case
//   where the Go server crashes and restarts)
// - (possible fix for previous point) store the state on disk? (when?)
// - "picture support" to visualize hosts (implies some sort of config system)
// - auto-refresh on asset/config change?

$(document).ready(function () {
  var heartbeatBuildDelaySeconds = 3;
  var heartbeatOfflineDelaySeconds = 70;

  var connecter;
  var conn;
  var statusConsole = $('#status-console .val');
  var statusServers = $('#status-servers');
  var servers = {};
  var sounds = {};

  function fmtDatetime(d) {
    function zero(n) {
      return ('0' + n).slice(-2);
    }

    return d.getFullYear() + "-" +
           zero(d.getMonth()+1) + "-" +
           zero(d.getDate()) + " " +
           zero(d.getHours()) + ":" +
           zero(d.getMinutes());
  }

  function howago(durationSeconds) {
    var res = parseInt(durationSeconds);
    var secs   = res;
    var mins   = Math.floor(res/60);
    var hours  = Math.floor(res/60/60);
    var days   = Math.floor(res/60/60/24);
    var months = Math.floor(res/60/60/24/30);
    var years  = Math.floor(res/60/60/24/30/12);

    if(secs < 60)
      return '' + secs + ' second' + (secs > 1 ? 's': '');
    if(mins < 60)
      return '' + mins + ' minute' + (mins > 1 ? 's': '');
    if(hours < 48)
      return '' + hours + ' hour' + (hours > 1 ? 's': '');
    if(days < 40)
      return '' + days + ' day' + (days > 1 ? 's': '');
    if(months < 12)
      return '' + months + ' month' + (months > 1 ? 's': '');
    return '' + years + ' year' + (years > 1 ? 's': '');
  }

  function alertsEnhance(data) {

    function lastTimeDesc(a,b) {
      if (a.LastTime < b.LastTime)
        return 1;
      if (a.LastTime > b.LastTime)
        return -1;
      return 0;
    }

    var res = [];
    $.each(data, function () {
      var alert = this;
      res.push(alert);
      // max() would do the trick, tbh
      if (alert.Type === "BAD")
        alert.LastTime = new Date(alert.BadTime);
      else
        alert.LastTime = new Date(alert.GoodTime);
    })
    res.sort(lastTimeDesc);
    return res;
  }

  function alertsBuild(alerts) {
    var root = $('#alerts');
    var rings = 0;
    root.empty();
    $.each(alerts, function () {
      var dAlert = $('<div/>').addClass('alert');
      var dDates = $('<div/>').addClass('dates').appendTo(dAlert);
      var dTitle = $('<div/>').addClass('title').appendTo(dAlert).text(this.Subject);
      var dDetails = $('<div/>').addClass('details').appendTo(dAlert)
      var pBadDetails = $('<pre/>').addClass('bad-details').appendTo(dDetails).text(this.BadDetails);
      var pGoodDetails = $('<pre/>').addClass('good-details').appendTo(dDetails).text(this.GoodDetails);
      var sExtra = $('<span/>').addClass('extra');

      dTitle.click(function (e) {
        e.preventDefault();
        dDetails.toggle('fast');
      })

      $('<span/>').text(this.NoseeSrv).appendTo(sExtra);
      sExtra.append(' ');
      $('<span/>').text(this.Classes.join(', ')).appendTo(sExtra);
      dTitle.append(' ').append(sExtra);

      var sStart = $('<span/>').addClass('start').appendTo(dDates);
      dDates.append(' ');
      var sEnd   = $('<span/>').addClass('end').appendTo(dDates);

      start = new Date(this.BadTime);
      sStart.text(fmtDatetime(start));
      if (this.Type === "GOOD") {
        dAlert.addClass('_good');
        end = new Date(this.GoodTime);
        sEnd.text(fmtDatetime(end));
      } else { // "BAD"
        rings++;
        $.each(this.Classes, function () {
          dAlert.addClass(""+this);
        });
        sEnd.text("--");
      }
      root.append(dAlert);
    });
    $('#count').text(rings);
  }

  function alertsRefresh() {
    var alerts = $.getJSON("/alerts", function (data) {
        alerts = alertsEnhance(data);
        alertsBuild(alerts);
    });
  }

  function heartbeatBuild() {
    statusServers.empty();
    $.each(servers, function (i, server) {
      var ts = Math.floor(Date.now() / 1000);

      var cssClass = 'ok';
      var txt = 'up since ' + howago(server.uptime);
      if (ts - server.lastPing > heartbeatOfflineDelaySeconds) {
        cssClass = 'ko';
        txt = 'down since ' + howago(ts - server.lastPing);
      }

      $('<div/>', {
        class: 'server',
        text: server.name,
      }).appendTo(statusServers)
      .append(' ')
      .append($('<span/>', {
        class: 'ver',
        text: '(' + server.version + ')',
      }))
      .append(': ')
      .append($('<span/>', {
        class: cssClass,
        text: txt,
      }));
    });
  }

  function heartbeat(server, version, uptime) {
    if (typeof servers[server] === "undefined") {
      servers[server] = {
        name: server,
        uptime: uptime,
        version: version,
        lastPing: Math.floor(Date.now() / 1000),
      }
    } else {
      servers[server].uptime = uptime;
      servers[server].version = version;
      servers[server].lastPing = Math.floor(Date.now() / 1000);
    }
  }

  function wsConnect() {
    // console.log("wsConnect");
    conn = new WebSocket("ws://" + document.location.host + "/ws");
    conn.onopen = function (evt) {
      statusConsole.text("connected").removeClass('ko').addClass('ok');
      alertsRefresh();
    };
    conn.onclose = function (evt) {
      statusConsole.text("no connection").removeClass('ok').addClass('ko');
    };
    conn.onmessage = function (evt) {
      console.log(evt.data);
      var dataParts = evt.data.split('|')
      switch (dataParts[0]) {
        case 'heartbeat':
          // dataParts[]: 1 = server, 2 = version, 3 = uptime (seconds)
          heartbeat(dataParts[1], dataParts[2], dataParts[3]);
          break;
        case 'purged':
          alertsRefresh();
          break;
        case 'created':
          alertsRefresh();
          sounds.failure.play();
          break;
        case 'fixed':
          alertsRefresh();
          sounds.success.play();
          break;
      }
    };
  }

  sounds.failure = new Howl({ src: ['sounds/failure.mp3', 'sounds/failure.ogg'] });
  sounds.success = new Howl({ src: ['sounds/success.mp3', 'sounds/success.ogg'] });

  if (window["WebSocket"]) {
    wsConnect();
    setInterval(function() {
      if (conn.readyState == 3)
        wsConnect();
    }, 2000);
  } else {
    status.text("no WebSocket support").attr('class', '');
  }

  setInterval(heartbeatBuild, heartbeatBuildDelaySeconds * 1000);
});
