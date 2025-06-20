set -x

mkdir -p /organizations/peerOrganizations/student-council.example.com/

export FABRIC_CA_CLIENT_HOME=/organizations/peerOrganizations/student-council.example.com/

fabric-ca-client enroll -u https://admin:adminpw@ca-student-council:8054 --caname ca-student-council --tls.certfiles "/organizations/fabric-ca/student-council/tls-cert.pem"

echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca-student-council-8054-ca-student-council.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca-student-council-8054-ca-student-council.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca-student-council-8054-ca-student-council.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca-student-council-8054-ca-student-council.pem
    OrganizationalUnitIdentifier: orderer' > "/organizations/peerOrganizations/student-council.example.com/msp/config.yaml"


fabric-ca-client register --caname ca-student-council --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "/organizations/fabric-ca/student-council/tls-cert.pem"


fabric-ca-client register --caname ca-student-council --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "/organizations/fabric-ca/student-council/tls-cert.pem"


fabric-ca-client register --caname ca-student-council --id.name councilAdmin --id.secret councilAdminpw --id.type admin --tls.certfiles "/organizations/fabric-ca/student-council/tls-cert.pem"


fabric-ca-client enroll -u https://peer0:peer0pw@ca-student-council:8054 --caname ca-student-council -M "/organizations/peerOrganizations/student-council.example.com/peers/peer0.student-council.example.com/msp" --csr.hosts peer0.student-council.example.com  --csr.hosts  peer0-student-council --tls.certfiles "/organizations/fabric-ca/student-council/tls-cert.pem"


cp "/organizations/peerOrganizations/student-council.example.com/msp/config.yaml" "/organizations/peerOrganizations/student-council.example.com/peers/peer0.student-council.example.com/msp/config.yaml"

fabric-ca-client enroll -u https://peer0:peer0pw@ca-student-council:8054 --caname ca-student-council -M "/organizations/peerOrganizations/student-council.example.com/peers/peer0.student-council.example.com/tls" --enrollment.profile tls --csr.hosts peer0.student-council.example.com --csr.hosts  peer0-student-council --csr.hosts ca-student-council --csr.hosts localhost --tls.certfiles "/organizations/fabric-ca/student-council/tls-cert.pem"

cp "/organizations/peerOrganizations/student-council.example.com/peers/peer0.student-council.example.com/tls/tlscacerts/"* "/organizations/peerOrganizations/student-council.example.com/peers/peer0.student-council.example.com/tls/ca.crt"
cp "/organizations/peerOrganizations/student-council.example.com/peers/peer0.student-council.example.com/tls/signcerts/"* "/organizations/peerOrganizations/student-council.example.com/peers/peer0.student-council.example.com/tls/server.crt"
cp "/organizations/peerOrganizations/student-council.example.com/peers/peer0.student-council.example.com/tls/keystore/"* "/organizations/peerOrganizations/student-council.example.com/peers/peer0.student-council.example.com/tls/server.key"

mkdir -p "/organizations/peerOrganizations/student-council.example.com/msp/tlscacerts"
cp "/organizations/peerOrganizations/student-council.example.com/peers/peer0.student-council.example.com/tls/tlscacerts/"* "/organizations/peerOrganizations/student-council.example.com/msp/tlscacerts/ca.crt"

mkdir -p "/organizations/peerOrganizations/student-council.example.com/tlsca"
cp "/organizations/peerOrganizations/student-council.example.com/peers/peer0.student-council.example.com/tls/tlscacerts/"* "/organizations/peerOrganizations/student-council.example.com/tlsca/tlsca.student-council.example.com-cert.pem"

mkdir -p "/organizations/peerOrganizations/student-council.example.com/ca"
cp "/organizations/peerOrganizations/student-council.example.com/peers/peer0.student-council.example.com/msp/cacerts/"* "/organizations/peerOrganizations/student-council.example.com/ca/ca.student-council.example.com-cert.pem"



fabric-ca-client enroll -u https://user1:user1pw@ca-student-council:8054 --caname ca-student-council -M "/organizations/peerOrganizations/student-council.example.com/users/User1@student-council.example.com/msp" --tls.certfiles "/organizations/fabric-ca/student-council/tls-cert.pem"


cp "/organizations/peerOrganizations/student-council.example.com/msp/config.yaml" "/organizations/peerOrganizations/student-council.example.com/users/User1@student-council.example.com/msp/config.yaml"

fabric-ca-client enroll -u https://councilAdmin:councilAdminpw@ca-student-council:8054 --caname ca-student-council -M "/organizations/peerOrganizations/student-council.example.com/users/Admin@student-council.example.com/msp" --tls.certfiles "/organizations/fabric-ca/student-council/tls-cert.pem"

cp "/organizations/peerOrganizations/student-council.example.com/msp/config.yaml" "/organizations/peerOrganizations/student-council.example.com/peers/peer0.student-council.example.com/msp/config.yaml"

{ set +x; } 2>/dev/null