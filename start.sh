#!/bin/bash

echo "🚌 Starting Bus Ticketing System..."
echo "📱 USSD Server: http://localhost:3000"
echo "🔧 Health Check: http://localhost:3000/ok"
echo "💾 Database Check: http://localhost:3000/db-ping"
echo ""
echo "📋 Available Endpoints:"
echo "  POST /ussd - Customer USSD interface"
echo "  POST /ussd-ops - Operator USSD interface"
echo ""
echo "🎯 Sample Operator PINs:"
echo "  Juba Express: 1234"
echo "  Unity Transport: 5678"
echo "  South Sudan Bus: 9999"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node server.js
