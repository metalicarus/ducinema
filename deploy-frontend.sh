#!/bin/bash

echo "🎬 Du Cinéma - Deploy Frontend"
echo "================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Build do Vue
echo -e "${BLUE}📦 Building Vue app...${NC}"
cd frontend
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build concluído com sucesso!${NC}"
else
    echo -e "${RED}✗ Erro no build!${NC}"
    exit 1
fi

# Deploy no Firebase Hosting
echo ""
echo -e "${BLUE}🚀 Deploying to Firebase Hosting...${NC}"
cd ..
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}✓ Deploy concluído com sucesso!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo -e "${BLUE}🌐 URL: https://du-cinema.web.app${NC}"
else
    echo -e "${RED}✗ Erro no deploy!${NC}"
    exit 1
fi
