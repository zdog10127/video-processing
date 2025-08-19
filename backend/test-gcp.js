const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

async function testGCPConnection() {
  console.log('🧪 Testando configuração do Google Cloud Storage...\n');

  try {
    console.log('📋 Configurações:');
    console.log(`   Project ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
    console.log(`   Bucket: ${process.env.GOOGLE_CLOUD_BUCKET}`);
    console.log(
      `   Credentials: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`,
    );
    console.log('');

    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET);

    console.log('🔍 Verificando bucket...');
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error(
        `Bucket ${process.env.GOOGLE_CLOUD_BUCKET} não encontrado`,
      );
    }
    console.log('✅ Bucket encontrado e acessível');

    console.log('📤 Testando upload...');
    const fileName = `test-${Date.now()}.txt`;
    const file = bucket.file(fileName);

    await file.save('Teste de upload do sistema de processamento de vídeos', {
      metadata: {
        contentType: 'text/plain',
      },
    });
    console.log(`✅ Upload de teste realizado: ${fileName}`);

    console.log('📥 Testando download...');
    const [content] = await file.download();
    console.log(`✅ Download de teste realizado: ${content.toString()}`);

    console.log('🔗 Gerando URL pública...');
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    console.log(`✅ URL pública: ${publicUrl}`);

    console.log('🧹 Limpando arquivo de teste...');
    await file.delete();
    console.log('✅ Arquivo de teste removido');

    console.log(
      '\n🎉 Configuração do Google Cloud Storage está funcionando perfeitamente!',
    );
  } catch (error) {
    console.error('\n❌ Erro na configuração do GCP:');
    console.error(`   ${error.message}`);

    if (error.code === 'ENOENT') {
      console.error('\n💡 Soluções possíveis:');
      console.error('   1. Verifique se o arquivo gcp-key.json existe');
      console.error(
        '   2. Verifique o caminho em GOOGLE_APPLICATION_CREDENTIALS',
      );
      console.error('   3. Execute: gcloud auth application-default login');
    }

    if (error.code === 403) {
      console.error('\n💡 Problema de permissões:');
      console.error(
        '   1. Verifique se o service account tem as permissões corretas',
      );
      console.error('   2. Verifique se o billing está ativo no projeto');
    }

    process.exit(1);
  }
}

testGCPConnection();
