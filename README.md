# My project's README

npm install
sudo mkdir /var/log/cmsv2
cd /var/log/cmsv2
sudo touch cmsv2-dataService-es6-debug.log
sudo chmod 777 cmsv2-dataService-es6-debug.log
sudo touch cmsv2-dataService-es6-info.log
sudo chmod 777 cmsv2-dataService-es6-info.log
cd -
grunt && node dist/app.js