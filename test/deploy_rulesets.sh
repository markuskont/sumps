#!/bin/bash
# This script is meant to be executed inside virtual machine
# The following oneliner on host should do the trick, but is untested
# vagrant ssh es -c "echo OINKCODE | /vagrant/test/deploy_rulesets.sh"

BASEDIR=/vagrant/suricata/rulesets/

echo "Please enter oinkcode: "
read OINKCODE

mkdir -p $BASEDIR/{et,sf}

cd /tmp
echo "downloading ET ruleset"
wget http://rules.emergingthreats.net/open/suricata/emerging.rules.tar.gz || exit 2
tar -xzf emerging.rules.tar.gz -C $BASEDIR/et/
cd -

if [[ -n $OINKCODE && $OINKCODE =~ [a-f0-9]+ ]]; then
	echo "downloading SF ruleset"
	cd /tmp
	wget -O sf.rules.tgz https://www.snort.org/rules/snortrules-snapshot-2976.tar.gz?oinkcode=$OINKCODE || exit 2
	tar -xzf sf.rules.tgz -C $BASEDIR/sf
	cd -
fi