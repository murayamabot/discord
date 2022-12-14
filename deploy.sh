#!/bin/bash
git pull

docker build . -t srizan10/murayama

docker stop murayama

docker rm murayama

docker run -d -t --name murayama --restart unless-stopped srizan10/murayama