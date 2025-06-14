import { useState, useEffect } from'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from'react-router-dom';
import { Layout, Dropdown, Avatar, Space, message } from 'antd';
import { UserOutlined, LogoutOutlined, LoginOutlined, HomeOutlined, ProfileOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';
import './App.css';
import type { MenuProps } from 'antd';

// 导入各页面组件
import HomePage from './pages/HomePage';
import FlightSearchResult from './pages/FlightSearchResult';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrderListPage from './pages/OrderListPage';
import OrderDetailPage from './pages/OrderDetailPage';

const { Header, Content, Footer } = Layout;

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  //从本地存储加载用户信息
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user data', error);
      }
    }
    setLoadingUser(false);
  }, []);

  // 登录处理函数
  const handleLogin = (user: User) => {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      // 验证存储是否成功
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        message.error('登录状态存储失败，请重新登录');
        handleLogout(); // 清除无效状态
      }
  };

  // 登出处理函数
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  
  // 用户登录后的下拉菜单
  const items: MenuProps['items'] = [
  {
      key: 'profile',
      label: (<a href="/orders">我的订单</a>),
      icon:<ProfileOutlined />
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      onClick:handleLogout
    }
  ];

  //主页链接
  const homeLink = (
    <Link to="/" className="login-link">
      <HomeOutlined />
    </Link>
  );

  //登录链接
  const loginLink = (
    <Link to="/login" className="login-link">
      <LoginOutlined /> 登录
    </Link>
  );

  return (
    <Router>
      <Layout className="layout">
        <Header>
          <div className="header-right">
            {homeLink}
            {loadingUser? (
              <span>加载中...</span>
            ) : currentUser? (
                <Dropdown menu={{ items }} trigger={['click']}>
                  <a onClick={(e) => e.preventDefault()}>
                    <Space>
                      <Avatar icon={<UserOutlined />} />
                      <span>{currentUser.firstName} {currentUser.lastName}</span>
                    </Space>
                  </a>
                </Dropdown>
            ) : (
              loginLink
            )}
          </div>
        </Header>
        <Content style={{ padding: '0 50px', minHeight: 'calc(100vh - 128px)' }}>
          <div className="site-layout-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/flights" element={<FlightSearchResult />} />
              <Route path="/booking/:tripType/:outboundFlightId/:returnFlightId?" element={<BookingPage />} />
              {/* <Route path="/login" element={<LoginPage onLogin={handleLogin} />} /> */}
               <Route 
                path="/login" 
                element={
                  currentUser ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />
                } 
              />
              <Route path="/register" element={<RegisterPage />} />
              {/* <Route path="/orders" element={currentUser? <OrderListPage /> : <Navigate to="/login" />} /> */}
              <Route path="/orders" element={<OrderListPage />} />
              {/* <Route path="/orders/:orderId" element={currentUser? <OrderDetailPage /> : <Navigate to="/login" />} /> */}
              <Route path="/orders/:reference" element={<OrderDetailPage /> }/>
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>航班预订系统 ©2025 版权所有</Footer>
      </Layout>
    </Router>
  );
}

export default App;

// 用户类型定义
export interface User {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
}