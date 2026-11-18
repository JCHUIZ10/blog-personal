document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("canvas-3d");
    if (!container || typeof THREE === "undefined") return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Grupo principal 3D (Estructura tipo red / topología)
    const group = new THREE.Group();
    scene.add(group);

    // Geometría base: Icosaedro
    const geometry = new THREE.IcosahedronGeometry(2, 1);

    // Malla de líneas (Gris medio #8A8D8F)
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x8A8D8F,
        wireframe: true,
        transparent: true,
        opacity: 0.45
    });
    const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
    group.add(wireframeMesh);

    // Nodos en los vértices (Amarillo #F6C945)
    const pointsMaterial = new THREE.PointsMaterial({
        color: 0xF6C945,
        size: 0.12
    });
    const pointsMesh = new THREE.Points(geometry, pointsMaterial);
    group.add(pointsMesh);

    // Núcleo interno sutil
    const coreGeo = new THREE.OctahedronGeometry(0.9, 0);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0xF6C945,
        wireframe: true,
        transparent: true,
        opacity: 0.2
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Interacción con el mouse
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener("mousemove", (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Animación fluida
    function animate() {
        requestAnimationFrame(animate);

        group.rotation.y += 0.004;
        group.rotation.x += 0.002;
        coreMesh.rotation.y -= 0.008;

        // Seguimiento suave al cursor
        group.position.x += (mouseX * 0.4 - group.position.x) * 0.05;
        group.position.y += (mouseY * 0.4 - group.position.y) * 0.05;

        renderer.render(scene, camera);
    }

    animate();

    // Adaptar tamaño al redimensionar pantalla
    window.addEventListener("resize", () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
});
