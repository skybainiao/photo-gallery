// app.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";
import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAi9uwdfkmHPrc9HtJCZFxFu-ppaUKa-G0",
  authDomain: "cn-9ae7f.firebaseapp.com",
  databaseURL: "https://cn-9ae7f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cn-9ae7f",
  storageBucket: "cn-9ae7f.appspot.com",
  messagingSenderId: "140450789584",
  appId: "1:140450789584:web:9ce26d3b449a6db23946d5",
  measurementId: "G-82DQRJWV33"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const storage = getStorage(app);

document.addEventListener('DOMContentLoaded', () => {
    // 获取密码输入框、提交按钮和错误提示元素
    const mainPasswordInput = document.getElementById('mainPassword');
    const submitPasswordButton = document.getElementById('submitPassword');
    const passwordError = document.getElementById('passwordError');

    // 模态窗元素
    const createFolderModal = document.getElementById('createFolderModal');
    const uploadPhotoModal = document.getElementById('uploadPhotoModal');
    const photoModal = document.getElementById('photoModal');

    // 按钮元素
    const addFolderButton = document.getElementById('addFolderButton');
    const createFolderBtn = document.getElementById('createFolderButton');
    const addPhotoButton = document.getElementById('addPhotoButton');
    const uploadPhotoBtn = document.getElementById('uploadPhotoButton');
    const backButton = document.getElementById('backButton');
    const closeButtons = document.querySelectorAll('.close');

    // 当前文件夹ID
    let currentFolderId = null;

    // 密码验证
    submitPasswordButton.addEventListener('click', () => {
        const inputPassword = mainPasswordInput.value.trim();
        if (inputPassword === "123") { // 设置你自己的密码
            document.getElementById('passwordModal').style.display = 'none';
            document.querySelector('.container').classList.remove('hidden');
            loadFolders();
        } else {
            alert('密码错误，请重试。');
        }
    });

    // 打开创建文件夹弹窗
    addFolderButton.addEventListener('click', () => {
        createFolderModal.style.display = 'block';
    });

    // 创建文件夹
    createFolderBtn.addEventListener('click', async () => {
        const folderName = document.getElementById('folderName').value.trim();
        const folderPassword = document.getElementById('folderPassword').value.trim();

        if (!folderName) {
            alert('请输入文件夹名称');
            return;
        }

        const folderData = {
            name: folderName,
            password: folderPassword || null,
            timestamp: Date.now()
        };

        try {
            const newFolderRef = push(ref(db, 'folders'));
            await set(newFolderRef, folderData);
            console.log('文件夹创建成功');
            loadFolders();
            document.getElementById('folderName').value = '';
            document.getElementById('folderPassword').value = '';
            createFolderModal.style.display = 'none';
        } catch (error) {
            console.error('创建文件夹失败:', error);
            alert('创建文件夹失败，请检查权限设置。');
        }
    });

    // 关闭弹窗
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            createFolderModal.style.display = 'none';
            uploadPhotoModal.style.display = 'none';
            photoModal.style.display = 'none';
        });
    });

    // 创建文件夹列表
    async function loadFolders() {
        const folderList = document.getElementById('folderList');
        folderList.innerHTML = '';

        try {
            const foldersSnapshot = await get(ref(db, 'folders'));
            if (foldersSnapshot.exists()) {
                const folders = foldersSnapshot.val();
                for (const key in folders) {
                    if (folders.hasOwnProperty(key)) {
                        const folder = folders[key];
                        const folderCard = document.createElement('div');
                        folderCard.className = 'folder-card';
                        folderCard.innerHTML = `<h3>${folder.name}</h3>`;
                        folderCard.addEventListener('click', () => openFolder(key, folder));
                        folderList.appendChild(folderCard);
                    }
                }
            } else {
                folderList.innerHTML = '<p>暂无文件夹</p>';
            }
        } catch (error) {
            console.error('加载文件夹失败:', error);
            alert('加载文件夹失败，请重试。');
        }
    }

    // 打开文件夹
    function openFolder(folderId, folder) {
        if (folder.password) {
            const folderPassword = prompt('请输入文件夹密码:');
            if (folderPassword !== folder.password) {
                alert('密码错误');
                return;
            }
        }
        currentFolderId = folderId;
        document.querySelector('.container').classList.add('hidden');
        const folderPage = document.querySelector('.folder-page');
        folderPage.classList.remove('hidden');
        loadPhotos(folderId);
    }

    // 返回主页
    backButton.addEventListener('click', () => {
        document.querySelector('.folder-page').classList.add('hidden');
        document.querySelector('.container').classList.remove('hidden');
        loadFolders();
    });

    // 打开上传照片弹窗
    addPhotoButton.addEventListener('click', () => {
        uploadPhotoModal.style.display = 'block';
    });

    // 上传照片
    uploadPhotoBtn.addEventListener('click', () => {
        uploadFile(currentFolderId);
    });

    // 加载照片
    async function loadPhotos(folderId) {
        const photoGallery = document.getElementById('photoGallery');
        photoGallery.innerHTML = '';

        try {
            const photosSnapshot = await get(ref(db, `photos/${folderId}`));
            if (photosSnapshot.exists()) {
                const photos = photosSnapshot.val();
                for (const key in photos) {
                    if (photos.hasOwnProperty(key)) {
                        const photo = photos[key];
                        const photoCard = document.createElement('div');
                        photoCard.className = 'photo-card';
                        photoCard.innerHTML = `<img src="${photo.url}" alt="照片">`;
                        photoCard.addEventListener('click', () => enlargePhoto(photo.url));
                        photoGallery.appendChild(photoCard);
                    }
                }
            } else {
                photoGallery.innerHTML = '<p>暂无照片</p>';
            }
        } catch (error) {
            console.error('加载照片失败:', error);
            alert('加载照片失败，请重试。');
        }
    }

    // 放大照片
    function enlargePhoto(url) {
        const enlargedPhoto = document.getElementById('enlargedPhoto');
        const closeBtn = photoModal.querySelector('.close');

        enlargedPhoto.src = url;
        photoModal.style.display = 'block';

        closeBtn.onclick = () => {
            photoModal.style.display = 'none';
        }

        window.onclick = (event) => {
            if (event.target == photoModal) {
                photoModal.style.display = 'none';
            }
        }
    }

    // 上传文件到特定文件夹
    async function uploadFile(folderId) {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (!file) {
            alert('请先选择文件');
            return;
        }

        const uniqueFilename = `${Date.now()}_${file.name}`;
        const storageReference = storageRef(storage, `photos/${folderId}/${uniqueFilename}`);
        const uploadTask = uploadBytesResumable(storageReference, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                document.getElementById('uploadProgress').style.width = progress + '%';
                console.log(`上传进度: ${progress}%`);
            },
            (error) => {
                console.error('上传失败:', error);
                alert('上传失败，请重试。');
            },
            async () => { 
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log('下载链接:', downloadURL);
                    // 保存到 Realtime Database
                    const newPhotoRef = push(ref(db, `photos/${folderId}`));
                    await set(newPhotoRef, {
                        url: downloadURL,
                        timestamp: Date.now()
                    });
                    loadPhotos(folderId); // 刷新当前文件夹
                    document.getElementById('uploadProgress').style.width = '0%';
                    fileInput.value = '';
                    uploadPhotoModal.style.display = 'none';
                    alert('上传成功！');
                } catch (error) {
                    console.error('获取下载链接或保存到数据库失败:', error);
                    alert('上传后处理失败，请重试。');
                }
            }
        );
    }
});
