// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";
import { getDatabase, ref, push, set, get, remove, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject, listAll } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

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

// 全局声明 currentFolderId
let currentFolderId = null;

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
    const backButtonFromMessageBoard = document.getElementById('backButtonFromMessageBoard'); // 新增
    const closeButtons = document.querySelectorAll('.close');

    // 删除按钮
    const deleteFolderButton = document.getElementById('deleteFolderButton');
    const deletePhotoButton = document.getElementById('deletePhotoButton');

    // 留言板元素
    const messageList = document.getElementById('messageList');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const messageBoardPage = document.querySelector('.message-board-page');

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

        // 禁止创建名为“留言板”的文件夹
        if (folderName === "留言板") {
            alert('“留言板”是系统保留文件夹，无法通过此方式创建。');
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

        // 添加固定的“留言板”文件夹
        addMessageBoardFolder();
    }

    // 添加固定的“留言板”文件夹
    function addMessageBoardFolder() {
        const folderList = document.getElementById('folderList');

        // 检查是否已经存在“留言板”文件夹
        const existingMessageBoard = Array.from(folderList.children).find(card => card.querySelector('h3').innerText === "留言板");
        if (existingMessageBoard) return; // 已存在，跳过

        const messageBoardCard = document.createElement('div');
        messageBoardCard.className = 'folder-card';
        messageBoardCard.innerHTML = `<h3>留言板</h3>`;
        messageBoardCard.addEventListener('click', () => openMessageBoard());
        folderList.appendChild(messageBoardCard);
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

        currentFolderId = folderId; // 设置全局 currentFolderId

        // 检查是否为留言板
        if (folder.name === "留言板") {
            openMessageBoard();
        } else {
            openPhotoGallery();
        }
    }

    // 打开照片画廊页面
    function openPhotoGallery() {
        document.querySelector('.container').classList.add('hidden');
        document.querySelector('.folder-page').classList.remove('hidden');
        loadPhotos(currentFolderId);
    }

    // 打开留言板页面
    function openMessageBoard() {
        document.querySelector('.container').classList.add('hidden');
        document.querySelector('.folder-page').classList.add('hidden');
        messageBoardPage.classList.remove('hidden');
        loadMessages();
    }

    // 返回主页按钮（照片画廊）
    backButton.addEventListener('click', () => {
        document.querySelector('.folder-page').classList.add('hidden');
        document.querySelector('.container').classList.remove('hidden');
        loadFolders();
    });

    // 返回主页按钮（留言板）
    backButtonFromMessageBoard.addEventListener('click', () => {
        messageBoardPage.classList.add('hidden');
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

    // 删除文件夹（包括数据库记录和存储文件）
    deleteFolderButton.addEventListener('click', async () => {
        if (!currentFolderId) {
            alert('未选择任何文件夹！');
            return;
        }

        // 禁止删除“留言板”文件夹
        const foldersSnapshot = await get(ref(db, `folders/${currentFolderId}`));
        if (foldersSnapshot.exists()) {
            const folder = foldersSnapshot.val();
            if (folder.name === "留言板") {
                alert('“留言板”文件夹不能被删除。');
                return;
            }
        }

        const confirmDelete = confirm('确定要删除整个文件夹及其中的所有照片吗？');
        if (!confirmDelete) return;

        try {
            // 1️⃣ 删除 Firebase Realtime Database 的文件夹和照片记录
            await remove(ref(db, `folders/${currentFolderId}`));
            await remove(ref(db, `photos/${currentFolderId}`));

            // 2️⃣ 删除 Firebase Storage 中的所有照片
            const storageFolderRef = storageRef(storage, `photos/${currentFolderId}`);
            await deleteFolderContents(storageFolderRef);

            alert('文件夹已成功删除！');
            document.querySelector('.folder-page').classList.add('hidden');
            document.querySelector('.container').classList.remove('hidden');
            loadFolders();
        } catch (error) {
            console.error('删除文件夹失败:', error);
            alert(`删除失败，请重试。\n错误信息: ${error.message}`);
        }
    });

    // 删除照片
    deletePhotoButton.addEventListener('click', async () => {
        const enlargedPhoto = document.getElementById('enlargedPhoto');
        const photoUrl = enlargedPhoto.src;

        if (!currentFolderId || !photoUrl) {
            alert('未选择文件夹或照片！');
            return;
        }

        const confirmDelete = confirm('确定要删除这张照片吗？');
        if (!confirmDelete) return;

        try {
            // 1️⃣ 获取 Firebase Database 中的照片路径
            const photosSnapshot = await get(ref(db, `photos/${currentFolderId}`));
            let photoKeyToDelete = null;
            let storagePath = null;

            if (photosSnapshot.exists()) {
                const photos = photosSnapshot.val();
                for (const key in photos) {
                    if (photos[key].url === photoUrl) {
                        photoKeyToDelete = key;
                        // 解析存储路径
                        storagePath = photos[key].url.split('/o/')[1].split('?')[0].replace(/%2F/g, '/');
                        break;
                    }
                }
            }

            // 2️⃣ 删除数据库中的照片记录
            if (photoKeyToDelete) {
                await remove(ref(db, `photos/${currentFolderId}/${photoKeyToDelete}`));
            }

            // 3️⃣ 删除 Firebase 存储中的照片
            if (storagePath) {
                const photoRef = storageRef(storage, storagePath);
                await deleteObject(photoRef);
            }

            alert('照片已删除！');
            photoModal.style.display = 'none';
            loadPhotos(currentFolderId);
        } catch (error) {
            console.error('删除照片失败:', error);
            
            if (error.message.includes("does not exist")) {
                console.warn("照片可能已经被删除。");
            } else {
                alert(`删除失败，请重试。\n错误信息: ${error.message}`);
            }
        }
    });

    // 删除文件夹中的所有文件
    async function deleteFolderContents(folderRef) {
        try {
            const fileList = await listAll(folderRef);
            for (const item of fileList.items) {
                await deleteObject(item);
            }
        } catch (error) {
            console.error("删除存储文件失败:", error);
            // ❌ 这里不要让它抛出错误，否则会误触发“删除失败”
        }
    }

    // 加载留言
    async function loadMessages() {
        const messagesRef = ref(db, 'messages');
        onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            messageList.innerHTML = '';
            if (data) {
                // 按时间排序（从旧到新）
                const sortedMessages = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
                sortedMessages.forEach(message => {
                    const messageItem = document.createElement('div');
                    messageItem.className = 'message-item';
                    const date = new Date(message.timestamp);
                    messageItem.innerHTML = `
                        <p>${escapeHtml(message.text)}</p>
                        <small>${date.toLocaleString()}</small>
                    `;
                    messageList.appendChild(messageItem);
                });
            } else {
                messageList.innerHTML = '<p>暂无留言</p>';
            }
        });
    }

    // 提交留言
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (text === "") {
            alert('留言不能为空');
            return;
        }

        const newMessageRef = push(ref(db, 'messages'));
        try {
            await set(newMessageRef, {
                text: text,
                timestamp: Date.now()
            });
            messageInput.value = '';
            alert('留言提交成功！');
        } catch (error) {
            console.error('提交留言失败:', error);
            alert('提交留言失败，请重试。');
        }
    });

    // 防止 XSS 攻击的简单转义函数
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
});
 