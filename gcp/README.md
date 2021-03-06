# Google Cloud setup

 You can find instructions to install google cloud sdk [here](https://cloud.google.com/sdk/downloads#yum).

 You have to add your [ssh keys](https://cloud.google.com/compute/docs/instances/adding-removing-ssh-keys).

 Google Cloud full setup is beyond this project , but here you can find a few tips.

## Firewall rules:

```[bash]
gcloud compute firewall-rules create openshift-console --allow tcp:8443 --description "Allow incoming traffic on TCP port 8443" --direction INGRESS --target-tags openshift-console
gcloud compute firewall-rules create default-allow-http --allow tcp:80 --description "Allow incoming traffic on TCP port 80" --direction INGRESS --target-tags default-allow-http
gcloud compute firewall-rules create default-allow-https --allow tcp:443 --description "Allow incoming traffic on TCP port 443" --direction INGRESS --target-tags default-allow-https
```

## Create Instance:

```[bash]
gcloud compute instances create instance1 --image-family centos-7 --image-project centos-cloud --machine-type g1-small --tags default-allow-http,default-allow-https,openshift-console
```

## Prerrequisites:

We will install and setup docker and a few other packages:

```[bash]
yum install docker wget git screen -y
cat << EOF > /etc/docker/daemon.json
{
   "insecure-registries": [
     "172.30.0.0/16"
   ]
}
EOF
systemctl enable docker
systemctl start docker
```

Allow access to the web console port (8443):

```[bash]
firewall-cmd --permanent --add-port=8443/tcp
firewall-cmd --reload
```

Download the openshift client:

```[bash]
curl -L --silent -o oc.tar.gz https://github.com/openshift/origin/releases/download/v3.11.0/openshift-origin-client-tools-v3.11.0-0cbc58b-linux-64bit.tar.gz && mkdir /tmp/oc && tar -xvf oc.tar.gz -C /tmp/oc && find /tmp/oc -name "oc" -type f -exec mv {} /usr/bin \; && rm -rf /tmp/oc oc.tar.gz
```

## OpenShift cluster and projects

Initiate oc cluster with the public ip of the instance:

```[bash]
oc cluster up --public-hostname=$(curl -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)
```

Setup the openshift projects:

```[bash]
oc adm new-project break-fix --display-name='Break & Fix'
oc new-app -f manager-app-template.yaml -n break-fix
oc adm policy add-cluster-role-to-user cluster-admin -z manager-app -n break-fix
oc adm new-project demo --display-name='Demoapp project'
oc create -f demoapp-template.yaml -n demo
oc new-app demoapp-template -n demo
oc adm new-project tty --display-name='Web terminal'
oc adm policy add-cluster-role-to-user cluster-admin -z online-oc -n tty
oc new-app -f tty-template.yaml -n tty
```

The template files are located at the [break-fix](../break-fix/)

## Accessing the application

* **Manager Application** http://manager-app-break-fix.<your_ip>.nip.io
* **Demo Application** http://demoapp-demo.<your_ip>.nip.io
* **TTY** http://online-oc-tty.<your_ip>.nip.io

```[bash]
for ip in `GCE_INI_PATH=~/.ansible/inventory/gce.ini ~/.ansible/inventory/gce.py --list --pretty | jq '._meta.hostvars[].gce_public_ip' -r`
do
  echo MACHINE: $ip
  echo -e "Manager App:\thttp://manager-app-break-fix.$ip.nip.io"
  echo -e "demo app:\thttp://demoapp-demo.$ip.nip.io"
  echo -e "tty:\t\thttp://online-oc-tty.$ip.nip.io"
done

MACHINE: 35.204.135.118
Manager App:  http://manager-app-break-fix.35.204.135.118.nip.io
demo app:     http://demoapp-demo.35.204.135.118.nip.io
tty:          http://online-oc-tty.35.204.135.118.nip.io
MACHINE:      35.204.221.18
Manager App:  http://manager-app-break-fix.35.204.221.18.nip.io
demo app:     http://demoapp-demo.35.204.221.18.nip.io
tty:          http://online-oc-tty.35.204.221.18.nip.io
```
