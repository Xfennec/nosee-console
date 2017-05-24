# Nosee-console
A simple Web based alert monitoring console, mostly for Nosee.

**Warning: Heavy WIP!**

What is it?
-----------

It's a simple HTTP server collecting [Nosee](https://github.com/Xfennec/nosee)
alerts and providing a Web interface. While it was developped with Nosee in
mind, it provides a HTTP REST-like interface, so you may interface it with
virtually anything else.

It uses a WebSocket to get new alerts and updates in realtime, and plays
notification sounds. Nosee-console is well suited for a permanent display.

![Nosee-console basic schema](https://raw.github.com/Xfennec/nosee-console/master/doc/images/img_base.png)

Show me!
--------

Mandatory screenshot (resized). There's two "unsolved" issues, here (orange
and red, various severity). You can have details by clicking on an issue.

![Nosee-console Web UI screenshot](https://raw.github.com/Xfennec/nosee-console/master/doc/images/img_illu.jpeg)

Web interface on a Raspberry Pi Zero. It's powered by the TV and boots directly
to Chromium "kiosk mode":

![Nosee-console on a Raspberry Pi Zero](https://raw.github.com/Xfennec/nosee-console/master/doc/images/nosee-console-pi.jpeg)

How do you build it?
--------------------

If you have Go installed:

	go get github.com/Xfennec/nosee-console

You will then be able to launch the binary located in you Go "bin" directory.
(since Go 1.8, `~/go/bin` if you haven't defined any `$GOPATH`)

The project is still too young to provide binaries. Later. (and `go get` is so powerful…)

As a reminder, you can use the `-u` flag to update the project and its dependencies  if
you don't want to use `git` for that.

	go get -u github.com/Xfennec/nosee-console

How do you use it?
------------------

### REST-like application
