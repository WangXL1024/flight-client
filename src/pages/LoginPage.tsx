// pages/LoginPage.js
import React, { useState } from'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
// 引入User类型定义
import type { User } from '../App';
import axios from 'axios';

// 明确props类型
type LoginPageProps = {
  onLogin: (user: User) => void;
};

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const location = useLocation(); // 获取当前位置
  const from = location.state?.from?.pathname || '/'; // 获取登录前的路径
  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8080/api/auth/login', {
            email:values.email,
            password:values.password
          });

      const { userId, email, accessToken, tokenType } = response.data;
      // 保存Token到本地存储
      localStorage.setItem('authToken', `${tokenType} ${accessToken}`);

      const userInfo :User = {
        userId,
        email,
        firstName:'',
        lastName:''
      };
      
      // 调用父组件传递的登录处理函数
      onLogin(userInfo);
      // 显示成功消息
      messageApi.info('登录成功');
      navigate(from, { replace: true });
      
    } catch (error) {
      console.error('登录失败', error);
      messageApi.error('登录失败，请检查您的凭证');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {contextHolder}
    <div className="login-container">
      <h1>用户登录</h1>
      <Form
        name="login"
        initialValues={{ remember: true }}
        onFinish={handleSubmit}
        scrollToFirstError
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: '请输入您的邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
        >
          <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="邮箱" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入您的密码' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="site-form-item-icon" />}
            placeholder="密码"
          />
        </Form.Item>
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            className="login-form-button"
            loading={loading}
          >
            登录
          </Button>
        </Form.Item>
      </Form>
    </div>
    </>
  );
};

export default LoginPage;