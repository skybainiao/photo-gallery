// app.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getDatabase, ref, push, set, query, orderByChild, equalTo, get } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
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
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

// 默认主密码
const MAIN_PASSWORD = "123";

// 获取密码输入框、提交按钮和错误提示元素
const mainPasswordInput = document.getElementById('mainPassword');
const submitPasswordButton = document.getElementById('submitPassword');
const passwordError = document.getElementById('passwordError');

// 为提交按钮添加点击事件监听器
submitPasswordButton.addEventListener('click', () => {
    const enteredPassword = mainPasswordInput.value;
    const correctPassword = '223658'; // 正确的密码

    if (enteredPassword === correctPassword) {
        // 密码正确，隐藏错误提示，显示主容器
        passwordError.style.display = 'none';
        document.getElementById('passwordModal').style.display = 'none';
        document.querySelector('.container').style.display = 'block';
        // 这里可以添加匿名登录等后续逻辑
    } else {
        // 密码错误，显示错误提示
        passwordError.style.display = 'block';
    }
});

// 等待 DOM 加载完成后绑定事件
document.addEventListener('DOMContentLoaded', () => {
    // 密码验证
    const submitPasswordBtn = document.getElementById('submitPassword');
    submitPasswordBtn.addEventListener('click', () => {
        const inputPassword = document.getElementById('mainPassword').value;
        if (inputPassword === MAIN_PASSWORD) {
            document.getElementById('passwordModal').style.display = 'none';
            document.querySelector('.container').style.display = 'block';
            signInAnonymously(auth)
              .then(() => {
                console.log("匿名登录成功");
                loadFolders();
              })
              .catch(error => {
                console.error("登录失败:", error);
                alert('匿名登录失败，请刷新页面重试。');
              });
        } else {
            alert('密码错误，请重试。');
        }
    });

    // 创建文件夹
    const createFolderBtn = document.getElementById('createFolderButton');
    createFolderBtn.addEventListener('click', async () => {
        const folderName = document.getElementById('folderName').value.trim();
        const folderPassword = document.getElementById('folderPassword').value.trim();

        if (!folderName) {
            alert('请输入文件夹名称');
            return;
        }

        const folderData = {
            name: folderName,
            password: folderPassword || null, // 如果未设置密码，设为null
            timestamp: Date.now()
        };

        try {
            const newFolderRef = push(ref(db, 'folders'));
            await set(newFolderRef, folderData);
            console.log('文件夹创建成功');
            loadFolders();
            document.getElementById('folderName').value = '';
            document.getElementById('folderPassword').value = '';
        } catch (error) {
            console.error('创建文件夹失败:', error);
            alert('创建文件夹失败，请检查权限设置。');
        }
    });
});

// 加载文件夹
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
    showPhotos(folderId, folder.name);
}

// 显示照片
async function showPhotos(folderId, folderName) {
    // 创建并显示照片库界面
    const container = document.querySelector('.container');
    container.innerHTML = `
        <h1>文件夹: ${folderName}</h1>
        <button id="backButton">返回</button>
        <div class="upload-box">
            <input type="file" id="fileInput" accept="image/*">
            <button id="uploadPhotoButton">上传照片</button>
            <div class="progress-bar">
                <div class="progress" id="uploadProgress"></div>
            </div>
        </div>
        <div class="gallery" id="photoGallery"></div>
    `;

    // 绑定返回按钮事件
    document.getElementById('backButton').addEventListener('click', () => {
        container.innerHTML = `
            <h1>WePic</h1>
            
            <!-- 创建文件夹区域 -->
            <div class="folder-box">
                <input type="text" id="folderName" placeholder="文件夹名称">
                <input type="password" id="folderPassword" placeholder="文件夹密码（可选）">
                <button id="createFolderButton">创建文件夹</button>
            </div>

            <!-- 文件夹列表 -->
            <div class="folder-list" id="folderList"></div>
        `;
        // 重新绑定创建文件夹事件
        const createFolderBtn = document.getElementById('createFolderButton');
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
            } catch (error) {
                console.error('创建文件夹失败:', error);
                alert('创建文件夹失败，请检查权限设置。');
            }
        });
        loadFolders();
    });

    // 绑定上传照片按钮事件
    document.getElementById('uploadPhotoButton').addEventListener('click', () => {
        uploadFile(folderId);
    });

    // 获取并显示照片
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
    const photoModal = document.getElementById('photoModal');
    const enlargedPhoto = document.getElementById('enlargedPhoto');
    const closeBtn = document.querySelector('.close');

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
                showPhotos(folderId); // 刷新当前文件夹
                document.getElementById('uploadProgress').style.width = '0%';
                fileInput.value = '';
                alert('上传成功！');
            } catch (error) {
                console.error('获取下载链接或保存到数据库失败:', error);
                alert('上传后处理失败，请重试。');
            }
        }
    );
}