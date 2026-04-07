#!/bin/bash

echo "🎬 Du Cinéma - Deploy Completo"
echo "================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Deploy Backend
echo -e "${BLUE}1/2 - Deploying Backend...${NC}"
./deploy-backend.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Erro no deploy do backend!${NC}"
    exit 1
fi

echo ""
echo "================================"
echo ""

# Deploy Frontend
echo -e "${BLUE}2/2 - Deploying Frontend...${NC}"
./deploy-frontend.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Erro no deploy do frontend!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Deploy completo realizado!${NC}"
echo -e "${GREEN}================================${NC}"
