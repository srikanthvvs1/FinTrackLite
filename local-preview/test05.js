const fs=require('fs');
const {context}=require('./server');
try {
  const result=context.runAllTests();
  fs.writeFileSync('local-preview/prompt05-tests.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify({passed:result.passed,failed:result.failed,total:result.total}));
  if(result.failed)process.exitCode=1;
} catch(error) {
  console.error(error.message);
  process.exitCode=1;
}
