// Inicializa TensorFlow.js + modelos face-api servidos localmente.
// Evita o backend WASM (precisa de arquivos .wasm externos e falha em rede local).
async function carregarFaceApi(modelUrl) {
    const url = modelUrl || '/models';
    const tf = faceapi.tf;

    const candidatos = ['webgl', 'cpu'];
    let backendOk = false;

    for (const nome of candidatos) {
        try {
            await tf.setBackend(nome);
            await tf.ready();
            if (tf.getBackend() === nome) {
                backendOk = true;
                console.log('TF.js backend:', nome);
                break;
            }
        } catch (err) {
            console.warn('Falha ao usar backend', nome, err);
        }
    }

    if (!backendOk) {
        throw new Error('Nenhum backend de IA disponível neste navegador.');
    }

    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(url),
        faceapi.nets.faceLandmark68Net.loadFromUri(url),
        faceapi.nets.faceRecognitionNet.loadFromUri(url)
    ]);
}
