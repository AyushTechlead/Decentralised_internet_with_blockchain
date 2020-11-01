

function createGail {

  echo
	echo "Enroll the CA admin"
  echo
	mkdir -p organizations/peerOrganizations/gail.example.com/

	export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/gail.example.com/
#  rm -rf $FABRIC_CA_CLIENT_HOME/fabric-ca-client-config.yaml
#  rm -rf $FABRIC_CA_CLIENT_HOME/msp

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:7054 --caname ca-gail --tls.certfiles ${PWD}/organizations/fabric-ca/gail/tls-cert.pem
  set +x

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-gail.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-gail.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-gail.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-gail.pem
    OrganizationalUnitIdentifier: orderer' > ${PWD}/organizations/peerOrganizations/gail.example.com/msp/config.yaml

for i in $(seq 0 $1); do
      echo
    	echo "Register peer${i}"
      echo
      set -x
    	fabric-ca-client register --caname ca-gail --id.name peer${i} --id.secret peer${i}pw --id.type peer --tls.certfiles ${PWD}/organizations/fabric-ca/gail/tls-cert.pem
      set +x
done

  echo
  echo "Register user"
  echo
  set -x
  fabric-ca-client register --caname ca-gail --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/organizations/fabric-ca/gail/tls-cert.pem
  set +x

  echo
  echo "Register the org admin"
  echo
  set -x
  fabric-ca-client register --caname ca-gail --id.name gailadmin --id.secret gailadminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/gail/tls-cert.pem
  set +x

	mkdir -p organizations/peerOrganizations/gail.example.com/peers

for i in $(seq 0 $1); do
      mkdir -p organizations/peerOrganizations/gail.example.com/peers/peer${i}.gail.example.com

      echo
      echo "## Generate the peer${i} msp"
      echo
      set -x
    	fabric-ca-client enroll -u https://peer${i}:peer${i}pw@localhost:7054 --caname ca-gail -M ${PWD}/organizations/peerOrganizations/gail.example.com/peers/peer${i}.gail.example.com/msp --csr.hosts peer${i}.gail.example.com --tls.certfiles ${PWD}/organizations/fabric-ca/gail/tls-cert.pem
      set +x

      cp ${PWD}/organizations/peerOrganizations/gail.example.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/gail.example.com/peers/peer${i}.gail.example.com/msp/config.yaml

      echo
      echo "## Generate the peer${i}-tls certificates"
      echo
      set -x
      fabric-ca-client enroll -u https://peer${i}:peer${i}pw@localhost:7054 --caname ca-gail -M ${PWD}/organizations/peerOrganizations/gail.example.com/peers/peer${i}.gail.example.com/tls --enrollment.profile tls --csr.hosts peer${i}.gail.example.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/gail/tls-cert.pem
      set +x


      cp ${PWD}/organizations/peerOrganizations/gail.example.com/peers/peer${i}.gail.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/gail.example.com/peers/peer${i}.gail.example.com/tls/ca.crt
      cp ${PWD}/organizations/peerOrganizations/gail.example.com/peers/peer${i}.gail.example.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/gail.example.com/peers/peer${i}.gail.example.com/tls/server.crt
      cp ${PWD}/organizations/peerOrganizations/gail.example.com/peers/peer${i}.gail.example.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/gail.example.com/peers/peer${i}.gail.example.com/tls/server.key

      mkdir -p ${PWD}/organizations/peerOrganizations/gail.example.com/msp/tlscacerts
      cp ${PWD}/organizations/peerOrganizations/gail.example.com/peers/peer${i}.gail.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/gail.example.com/msp/tlscacerts/ca.crt

      mkdir -p ${PWD}/organizations/peerOrganizations/gail.example.com/tlsca
      cp ${PWD}/organizations/peerOrganizations/gail.example.com/peers/peer${i}.gail.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/gail.example.com/tlsca/tlsca.gail.example.com-cert.pem

      mkdir -p ${PWD}/organizations/peerOrganizations/gail.example.com/ca
      cp ${PWD}/organizations/peerOrganizations/gail.example.com/peers/peer${i}.gail.example.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/gail.example.com/ca/ca.gail.example.com-cert.pem
done

  mkdir -p organizations/peerOrganizations/gail.example.com/users
  mkdir -p organizations/peerOrganizations/gail.example.com/users/User1@gail.example.com

  echo
  echo "## Generate the user msp"
  echo
  set -x
	fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --caname ca-gail -M ${PWD}/organizations/peerOrganizations/gail.example.com/users/User1@gail.example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/gail/tls-cert.pem
  set +x

  mkdir -p organizations/peerOrganizations/gail.example.com/users/Admin@gail.example.com

  echo
  echo "## Generate the org admin msp"
  echo
  set -x
	fabric-ca-client enroll -u https://gailadmin:gailadminpw@localhost:7054 --caname ca-gail -M ${PWD}/organizations/peerOrganizations/gail.example.com/users/Admin@gail.example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/gail/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/gail.example.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/gail.example.com/users/Admin@gail.example.com/msp/config.yaml

}


function createContractors {

  echo
	echo "Enroll the CA admin"
  echo
	mkdir -p organizations/peerOrganizations/contractors.example.com/

	export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/contractors.example.com/
#  rm -rf $FABRIC_CA_CLIENT_HOME/fabric-ca-client-config.yaml
#  rm -rf $FABRIC_CA_CLIENT_HOME/msp

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:8054 --caname ca-contractors --tls.certfiles ${PWD}/organizations/fabric-ca/contractors/tls-cert.pem
  set +x

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-contractors.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-contractors.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-contractors.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-contractors.pem
    OrganizationalUnitIdentifier: orderer' > ${PWD}/organizations/peerOrganizations/contractors.example.com/msp/config.yaml

for i in $(seq 0 $2); do
      echo
    	echo "Register peer${i}"
      echo
      set -x
    	fabric-ca-client register --caname ca-contractors --id.name peer${i} --id.secret peer${i}pw --id.type peer --tls.certfiles ${PWD}/organizations/fabric-ca/contractors/tls-cert.pem
      set +x
done

  echo
  echo "Register user"
  echo
  set -x
  fabric-ca-client register --caname ca-contractors --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/organizations/fabric-ca/contractors/tls-cert.pem
  set +x

  echo
  echo "Register the org admin"
  echo
  set -x
  fabric-ca-client register --caname ca-contractors --id.name contractorsadmin --id.secret contractorsadminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/contractors/tls-cert.pem
  set +x

	mkdir -p organizations/peerOrganizations/contractors.example.com/peers
for i in $(seq 0 $2); do
      mkdir -p organizations/peerOrganizations/contractors.example.com/peers/peer${i}.contractors.example.com

      echo
      echo "## Generate the peer${i} msp"
      echo
      set -x
    	fabric-ca-client enroll -u https://peer${i}:peer${i}pw@localhost:8054 --caname ca-contractors -M ${PWD}/organizations/peerOrganizations/contractors.example.com/peers/peer${i}.contractors.example.com/msp --csr.hosts peer${i}.contractors.example.com --tls.certfiles ${PWD}/organizations/fabric-ca/contractors/tls-cert.pem
      set +x

      cp ${PWD}/organizations/peerOrganizations/contractors.example.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/contractors.example.com/peers/peer${i}.contractors.example.com/msp/config.yaml

      echo
      echo "## Generate the peer${i}-tls certificates"
      echo
      set -x
      fabric-ca-client enroll -u https://peer${i}:peer${i}pw@localhost:8054 --caname ca-contractors -M ${PWD}/organizations/peerOrganizations/contractors.example.com/peers/peer${i}.contractors.example.com/tls --enrollment.profile tls --csr.hosts peer${i}.contractors.example.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/contractors/tls-cert.pem
      set +x


      cp ${PWD}/organizations/peerOrganizations/contractors.example.com/peers/peer${i}.contractors.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/contractors.example.com/peers/peer${i}.contractors.example.com/tls/ca.crt
      cp ${PWD}/organizations/peerOrganizations/contractors.example.com/peers/peer${i}.contractors.example.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/contractors.example.com/peers/peer${i}.contractors.example.com/tls/server.crt
      cp ${PWD}/organizations/peerOrganizations/contractors.example.com/peers/peer${i}.contractors.example.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/contractors.example.com/peers/peer${i}.contractors.example.com/tls/server.key

      mkdir -p ${PWD}/organizations/peerOrganizations/contractors.example.com/msp/tlscacerts
      cp ${PWD}/organizations/peerOrganizations/contractors.example.com/peers/peer${i}.contractors.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/contractors.example.com/msp/tlscacerts/ca.crt

      mkdir -p ${PWD}/organizations/peerOrganizations/contractors.example.com/tlsca
      cp ${PWD}/organizations/peerOrganizations/contractors.example.com/peers/peer${i}.contractors.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/contractors.example.com/tlsca/tlsca.contractors.example.com-cert.pem

      mkdir -p ${PWD}/organizations/peerOrganizations/contractors.example.com/ca
      cp ${PWD}/organizations/peerOrganizations/contractors.example.com/peers/peer${i}.contractors.example.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/contractors.example.com/ca/ca.contractors.example.com-cert.pem
done

  mkdir -p organizations/peerOrganizations/contractors.example.com/users
  mkdir -p organizations/peerOrganizations/contractors.example.com/users/User1@contractors.example.com

  echo
  echo "## Generate the user msp"
  echo
  set -x
	fabric-ca-client enroll -u https://user1:user1pw@localhost:8054 --caname ca-contractors -M ${PWD}/organizations/peerOrganizations/contractors.example.com/users/User1@contractors.example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/contractors/tls-cert.pem
  set +x

  mkdir -p organizations/peerOrganizations/contractors.example.com/users/Admin@contractors.example.com

  echo
  echo "## Generate the org admin msp"
  echo
  set -x
	fabric-ca-client enroll -u https://contractorsadmin:contractorsadminpw@localhost:8054 --caname ca-contractors -M ${PWD}/organizations/peerOrganizations/contractors.example.com/users/Admin@contractors.example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/contractors/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/contractors.example.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/contractors.example.com/users/Admin@contractors.example.com/msp/config.yaml

}

function createOrderer {

  echo
	echo "Enroll the CA admin"
  echo
	mkdir -p organizations/ordererOrganizations/example.com

	export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/ordererOrganizations/example.com
#  rm -rf $FABRIC_CA_CLIENT_HOME/fabric-ca-client-config.yaml
#  rm -rf $FABRIC_CA_CLIENT_HOME/msp

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:9054 --caname ca-orderer --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  set +x

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: orderer' > ${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml


  echo
	echo "Register orderer"
  echo
  set -x
	fabric-ca-client register --caname ca-orderer --id.name orderer --id.secret ordererpw --id.type orderer --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
    set +x

  echo
  echo "Register the orderer admin"
  echo
  set -x
  fabric-ca-client register --caname ca-orderer --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  set +x

	mkdir -p organizations/ordererOrganizations/example.com/orderers
  mkdir -p organizations/ordererOrganizations/example.com/orderers/example.com

  mkdir -p organizations/ordererOrganizations/example.com/orderers/orderer.example.com

  echo
  echo "## Generate the orderer msp"
  echo
  set -x
	fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp --csr.hosts orderer.example.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  set +x

  cp ${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/config.yaml

  echo
  echo "## Generate the orderer-tls certificates"
  echo
  set -x
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls --enrollment.profile tls --csr.hosts orderer.example.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  set +x

  cp ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt
  cp ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/signcerts/* ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
  cp ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/keystore/* ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key

  mkdir ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts
  cp ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

  mkdir ${PWD}/organizations/ordererOrganizations/example.com/msp/tlscacerts
  cp ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* ${PWD}/organizations/ordererOrganizations/example.com/msp/tlscacerts/tlsca.example.com-cert.pem

  mkdir -p organizations/ordererOrganizations/example.com/users
  mkdir -p organizations/ordererOrganizations/example.com/users/Admin@example.com

  echo
  echo "## Generate the admin msp"
  echo
  set -x
	fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:9054 --caname ca-orderer -M ${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  set +x

  cp ${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml ${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/config.yaml


}
