#!/bin/bash

echo "🎬 Du Cinéma - Deploy Backend"
echo "================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se há mudanças
echo -e "${BLUE}🔍 Verificando mudanças nas functions...${NC}"

# Deploy das Cloud Functions
echo -e "${BLUE}🚀 Deploying Cloud Functions...${NC}"
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}✓ Deploy concluído com sucesso!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo -e "${BLUE}🔗 API URL: https://api-p7h2itfhbq-uc.a.run.app${NC}"
else
    echo -e "${RED}✗ Erro no deploy!${NC}"
    exit 1
fi
