#!/usr/bin/env bash
# responsible for bootstrapping your environment for development.

BREW=`which brew`
ANSIBLE=`which ansible-playbook`
OS=`uname -s`

if [ "$OS" == "Darwin" ]
then
  if [ "$BREW" == "" ]
  then
    echo "Installing homebrew" > /dev/stdout
    ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
  fi
  if [ "$ANSIBLE" == "" ]
  then
    echo "Installing Ansible via brew" > /dev/stdout
    brew install ansible
  fi
fi

if [ "$ANSIBLE" == "" ]
then
  echo "Must Install Ansible first" > /dev/stdout
  exit -1
fi

echo "Configuring development environment using Ansible" > /dev/stdout
ansible-playbook ansible/config-developer-machine.yml 
