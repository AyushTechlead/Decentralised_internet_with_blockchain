#!/bin/bash

function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\n",$0;}' $1`"
}

# Gail JSON
cat <<EOF > organizations/peerOrganizations/gail.example.com/connection-gail.json
{
    "name": "test-network-gail",
    "version": "1.0.0",
    "client": {
        "organization": "Gail",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300"
                }
            }
        }
    },
    "organizations": {
        "Gail": {
            "mspid": "GailMSP",
            "peers": [
EOF

for i in $(seq 0 $(($1-2))); do
    cat <<EOF >> organizations/peerOrganizations/gail.example.com/connection-gail.json
                "peer$i.gail.example.com",
EOF
done

cat <<EOF >> organizations/peerOrganizations/gail.example.com/connection-gail.json
                "peer$(($1-1)).gail.example.com"
EOF

PEERPEM=organizations/peerOrganizations/gail.example.com/tlsca/tlsca.gail.example.com-cert.pem
CAPEM=organizations/peerOrganizations/gail.example.com/ca/ca.gail.example.com-cert.pem
PP=$(one_line_pem $PEERPEM)
CP=$(one_line_pem $CAPEM)
cat <<EOF >> organizations/peerOrganizations/gail.example.com/connection-gail.json
            ],
            "certificateAuthorities": [
                "ca.gail.example.com"
            ]
        }
    },
    "peers": {
        "peer0.gail.example.com": {
            "url": "grpcs://localhost:7051",
            "tlsCACerts": {
                "pem": "$PP"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer0.gail.example.com",
                "hostnameOverride": "peer0.gail.example.com"
            }
        },
EOF

for i in $(seq 1 $(($1-2))); do
    cat <<EOF >> organizations/peerOrganizations/gail.example.com/connection-gail.json
        "peer$i.gail.example.com": {
            "url": "grpcs://localhost:$((2*$i+7053))",
            "tlsCACerts": {
                "pem": "$PP"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer$i.gail.example.com",
                "hostnameOverride": "peer$i.gail.example.com"
            }
        },
EOF
done

cat <<EOF >> organizations/peerOrganizations/gail.example.com/connection-gail.json
        "peer$(($1-1)).gail.example.com": {
            "url": "grpcs://localhost:$((2*($1-1)+7053))",
            "tlsCACerts": {
                "pem": "$PP"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer$(($1-1)).gail.example.com",
                "hostnameOverride": "peer$(($1-1)).gail.example.com"
            }
        }
EOF

cat <<EOF >> organizations/peerOrganizations/gail.example.com/connection-gail.json
    },
    "certificateAuthorities": {
        "ca.gail.example.com": {
            "url": "https://localhost:7054",
            "caName": "ca-gail",
            "tlsCACerts": {
                "pem": ["$CP"]
            },
            "httpOptions": {
                "verify": false
            }
        }
    }
}
EOF

# Contractors JSON
cat <<EOF > organizations/peerOrganizations/contractors.example.com/connection-contractors.json
{
    "name": "test-network-contractors",
    "version": "1.0.0",
    "client": {
        "organization": "Contractors",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300"
                }
            }
        }
    },
    "organizations": {
        "Contractors": {
            "mspid": "ContractorsMSP",
            "peers": [
EOF

for i in $(seq 0 $(($2-2))); do
    cat <<EOF >> organizations/peerOrganizations/contractors.example.com/connection-contractors.json
                "peer$i.contractors.example.com",
EOF
done

cat <<EOF >> organizations/peerOrganizations/contractors.example.com/connection-contractors.json
                "peer$(($2-1)).contractors.example.com"
EOF

PEERPEM=organizations/peerOrganizations/contractors.example.com/tlsca/tlsca.contractors.example.com-cert.pem
CAPEM=organizations/peerOrganizations/contractors.example.com/ca/ca.contractors.example.com-cert.pem
PP=$(one_line_pem $PEERPEM)
CP=$(one_line_pem $CAPEM)
cat <<EOF >> organizations/peerOrganizations/contractors.example.com/connection-contractors.json
            ],
            "certificateAuthorities": [
                "ca.contractors.example.com"
            ]
        }
    },
    "peers": {
        "peer0.contractors.example.com": {
            "url": "grpcs://localhost:9051",
            "tlsCACerts": {
                "pem": "$PP"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer0.contractors.example.com",
                "hostnameOverride": "peer0.contractors.example.com"
            }
        },
EOF

for i in $(seq 1 $(($2-2))); do
    cat <<EOF >> organizations/peerOrganizations/contractors.example.com/connection-contractors.json
        "peer$i.contractors.example.com": {
            "url": "grpcs://localhost:$((2*$i+9053))",
            "tlsCACerts": {
                "pem": "$PP"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer$i.contractors.example.com",
                "hostnameOverride": "peer$i.contractors.example.com"
            }
        },
EOF
done

cat <<EOF >> organizations/peerOrganizations/contractors.example.com/connection-contractors.json
        "peer$(($2-1)).contractors.example.com": {
            "url": "grpcs://localhost:$((2*($2-1)+9053))",
            "tlsCACerts": {
                "pem": "$PP"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer$(($2-1)).contractors.example.com",
                "hostnameOverride": "peer$(($2-1)).contractors.example.com"
            }
        }
EOF

cat <<EOF >> organizations/peerOrganizations/contractors.example.com/connection-contractors.json
    },
    "certificateAuthorities": {
        "ca.contractors.example.com": {
            "url": "https://localhost:8054",
            "caName": "ca-contractors",
            "tlsCACerts": {
                "pem": ["$CP"]
            },
            "httpOptions": {
                "verify": false
            }
        }
    }
}
EOF
