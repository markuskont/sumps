# -*- mode: ruby -*-
# vi: set ft=ruby :


$elasticsearch = <<SCRIPT

if [ -z `apt-cache policy elasticsearch | grep (none)` ]; then
  sudo wget -O - http://packages.elasticsearch.org/GPG-KEY-elasticsearch | apt-key add -
  sudo echo 'deb http://packages.elasticsearch.org/elasticsearch/1.7/debian stable main' | tee /etc/apt/sources.list.d/elasticsearch.list
  sudo apt-get update
  sudo apt-get install -y openjdk-7-jre-headless elasticsearch < /dev/null
  
  sudo update-rc.d elasticsearch defaults
  
  sudo echo 'http.cors.allow-origin: "/.*/"' >> /etc/elasticsearch/elasticsearch.yml
  sudo echo 'http.cors.enabled: true' >> /etc/elasticsearch/elasticsearch.yml
  
  sudo echo 'ES_HEAP_SIZE=2g' >> /etc/default/elasticsearch
  
  sudo service elasticsearch stop
  sudo service elasticsearch start
  
  sudo /usr/share/elasticsearch/bin/plugin -install mobz/elasticsearch-head
fi

curl -XPUT localhost:9200/_template/bro -d @/vagrant/elasticsearch/templates/bro.json

SCRIPT

$packages = <<SCRIPT
apt-get update
apt-get install -y nodejs npm htop < /dev/null
SCRIPT

$bro = <<SCRIPT
wget -q http://download.opensuse.org/repositories/network:bro/xUbuntu_14.04/Release.key
sleep 1
sudo apt-key add - < Release.key
sleep 1
sudo sh -c "echo 'deb http://download.opensuse.org/repositories/network:/bro/xUbuntu_14.04/ /' >> /etc/apt/sources.list.d/bro.list"
sudo apt-get update
sudo apt-get -y --force-yes install bro

sudo cat <<EOF > /opt/bro/etc/networks.cfg
192.168.56.0/24     Private IP space
EOF

sed -i 's/^interface=.*/interface=eth0/g' /opt/bro/etc/node.cfg

sudo echo '@load tuning/json-logs' >> /opt/bro/share/bro/site/local.bro
sudo /opt/bro/bin/broctl install

sudo mkdir /opt/bro/share/bro/custom/
sudo cp /opt/bro/spool/installed-scripts-do-not-touch/auto/local-networks.bro /opt/bro/share/bro/custom/
sudo echo '@load custom/local-networks.bro' >> /opt/bro/share/bro/site/local.bro

sudo /opt/bro/bin/broctl install
sudo /opt/bro/bin/broctl check
SCRIPT

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.provider :virtualbox do |vb|
    vb.customize ["modifyvm", :id, "--memory", "4096"]
    vb.customize ["modifyvm", :id, "--cpus", "2"]
  end
  config.vm.define "es" do |es|
    es.vm.hostname = "es"
    es.vm.network "private_network", 
      ip: "192.168.56.15"
    es.vm.provision "shell",
      inline: $elasticsearch
    es.vm.provision "shell",
      inline: $packages
    es.vm.provision "shell",
      inline: $bro
  end
end