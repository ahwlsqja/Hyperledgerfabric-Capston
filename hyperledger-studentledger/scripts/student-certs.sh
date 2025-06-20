set -x

mkdir -p /organizations/peerOrganizations/student.example.com/

export FABRIC_CA_CLIENT_HOME=/organizations/peerOrganizations/student.example.com/

fabric-ca-client enroll -u https://admin:adminpw@ca-student:7054 --caname ca-student --tls.certfiles "/organizations/fabric-ca/student/tls-cert.pem"


echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca-student-7054-ca-student.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca-student-7054-ca-student.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca-student-7054-ca-student.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca-student-7054-ca-student.pem
    OrganizationalUnitIdentifier: orderer' > "/organizations/peerOrganizations/student.example.com/msp/config.yaml"


fabric-ca-client register --caname ca-student --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "/organizations/fabric-ca/student/tls-cert.pem"


fabric-ca-client register --caname ca-student --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "/organizations/fabric-ca/student/tls-cert.pem"


fabric-ca-client register --caname ca-student --id.name studentadmin --id.secret studentadminpw --id.type admin --tls.certfiles "/organizations/fabric-ca/student/tls-cert.pem"


fabric-ca-client enroll -u https://peer0:peer0pw@ca-student:7054 --caname ca-student -M "/organizations/peerOrganizations/student.example.com/peers/peer0.student.example.com/msp" --csr.hosts peer0.student.example.com  --csr.hosts  peer0-student --tls.certfiles "/organizations/fabric-ca/student/tls-cert.pem"


cp "/organizations/peerOrganizations/student.example.com/msp/config.yaml" "/organizations/peerOrganizations/student.example.com/peers/peer0.student.example.com/msp/config.yaml"

fabric-ca-client enroll -u https://peer0:peer0pw@ca-student:7054 --caname ca-student -M "/organizations/peerOrganizations/student.example.com/peers/peer0.student.example.com/tls" --enrollment.profile tls --csr.hosts peer0.student.example.com --csr.hosts  peer0-student --csr.hosts ca-student --csr.hosts localhost --tls.certfiles "/organizations/fabric-ca/student/tls-cert.pem"

cp "/organizations/peerOrganizations/student.example.com/peers/peer0.student.example.com/tls/tlscacerts/"* "/organizations/peerOrganizations/student.example.com/peers/peer0.student.example.com/tls/ca.crt"
cp "/organizations/peerOrganizations/student.example.com/peers/peer0.student.example.com/tls/signcerts/"* "/organizations/peerOrganizations/student.example.com/peers/peer0.student.example.com/tls/server.crt"
cp "/organizations/peerOrganizations/student.example.com/peers/peer0.student.example.com/tls/keystore/"* "/organizations/peerOrganizations/student.example.com/peers/peer0.student.example.com/tls/server.key"

mkdir -p "/organizations/peerOrganizations/student.example.com/msp/tlscacerts"
cp "/organizations/peerOrganizations/student.example.com/peers/peer0.student.example.com/tls/tlscacerts/"* "/organizations/peerOrganizations/student.example.com/msp/tlscacerts/ca.crt"

mkdir -p "/organizations/peerOrganizations/student.example.com/tlsca"
cp "/organizations/peerOrganizations/student.example.com/peers/peer0.student.example.com/tls/tlscacerts/"* "/organizations/peerOrganizations/student.example.com/tlsca/tlsca.student.example.com-cert.pem"

mkdir -p "/organizations/peerOrganizations/student.example.com/ca"
cp "/organizations/peerOrganizations/student.example.com/peers/peer0.student.example.com/msp/cacerts/"* "/organizations/peerOrganizations/student.example.com/ca/ca.student.example.com-cert.pem"



fabric-ca-client enroll -u https://user1:user1pw@ca-student:7054 --caname ca-student -M "/organizations/peerOrganizations/student.example.com/users/User1@student.example.com/msp" --tls.certfiles "/organizations/fabric-ca/student/tls-cert.pem"


cp "/organizations/peerOrganizations/student.example.com/msp/config.yaml" "/organizations/peerOrganizations/student.example.com/users/User1@student.example.com/msp/config.yaml"

fabric-ca-client enroll -u https://studentadmin:studentadminpw@ca-student:7054 --caname ca-student -M "/organizations/peerOrganizations/student.example.com/users/Admin@student.example.com/msp" --tls.certfiles "/organizations/fabric-ca/student/tls-cert.pem"

cp "/organizations/peerOrganizations/student.example.com/msp/config.yaml" "/organizations/peerOrganizations/student.example.com/peers/peer0.student.example.com/msp/config.yaml"

{ set +x; } 2>/dev/null