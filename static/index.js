// TODO:
// - inform users when we've lost connection? (i want to tackle the case
//   where the Go server crashes and restarts)
// - (possible fix for previous point) store the state on disk? (when?)
// - "picture support" to visualize hosts (implies some sort of config system)
// - auto-refresh on asset/config change?

$(document).ready(function () {

  var connecter;
  var conn;
  var status = $('#status');
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

  function wsConnect() {
    // console.log("wsConnect");
    conn = new WebSocket("ws://" + document.location.host + "/ws");
    conn.onopen = function (evt) {
      status.text("Live").attr('class', 'ok');
      alertsRefresh();
    };
    conn.onclose = function (evt) {
      status.text("No connection").attr('class', 'ko');
    };
    conn.onmessage = function (evt) {
      alertsRefresh();
      console.log(evt.data);
      switch (evt.data) {
        case 'created':
          sounds.failure.play();
          break;
        case 'fixed':
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
});
