const fs=require('fs');
const {context}=require('./server');
try {const result=context.runAllTests();fs.writeFileSync('local-preview/prompt03-tests.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));}catch(e){console.error(e.message);process.exitCode=1;}
