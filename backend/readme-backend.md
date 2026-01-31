   # Via header
   curl -X POST http://localhost:3001/api/feed/partner?partner=A \
     -H "X-API-Key: secret-key-pat-a" \
     -H "Content-Type: application/json" \
     -d '{"skuId": "123", "transactionTimeMs": 1234567890, "amount": 100}'
   
   # Via query parameter
   curl -X POST "http://localhost:3001/api/feed/partner-a?apiKey=your-secret-key-here" \
     -H "Content-Type: application/json" \
     -d '{"skuId": "123", "transactionTimeMs": 1234567890, "amount": 100}'

