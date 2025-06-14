import { useState } from 'react';
import { Form, Input, Button, Select, message, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
import api from '../services/http';

const { Option } = Select;

// 模拟国家数据
const countries = [
  '中国', '美国', '英国', '加拿大', '澳大利亚', '德国', '法国', '日本', '韩国', '其他',
];

function RegisterPage() {
  const navigate = useNavigate();
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const onFinish = (values: any) => {
    // 注册请求
    const handleRegister = async () => {
        try {
          const response = await api.post('/user/register', {
            email: values.email,
            password: values.password,
            firstName: values.firstName,
            lastName: values.lastName,
            country: values.country,
            phone: values.phone
          });
          console.log(response)     
        } catch (err) {
          setRegisterError('注册失败');
          console.error(err);
        } 
    }
    handleRegister()
    
    // 注册成功
    setTimeout(() => {
      setRegisterSuccess(true);
      setRegisterError(null);
      message.success('注册成功，请登录');
    }, 1000);
  };

  const goToLogin = () => {
    navigate('/login');
  };

  if (registerSuccess) {
    return (
      <div className="register-success">
        <Alert 
          message="注册成功" 
          description="您已成功注册账户，请使用您的邮箱和密码登录。" 
          type="success" 
          showIcon 
          style={{ margin: '24px auto', maxWidth: 600 }} 
        />
        <Button 
          type="primary" 
          onClick={goToLogin}
          style={{ display: 'block', margin: '0 auto' }}
        >
          前往登录
        </Button>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <h2>用户注册</h2>
        
        {registerError && (
          <Alert message={registerError} type="error" showIcon style={{ marginBottom: 16 }} />
        )}

        <Form
          name="register"
          className="register-form"
          onFinish={onFinish}
          scrollToFirstError
        >
          <Form.Item
            name="lastName"
            rules={[{ required: true, message: '请输入您的姓氏' }]}
          >
            <Input 
              prefix={<UserOutlined className="site-form-item-icon" />} 
              placeholder="姓氏" 
            />
          </Form.Item>
          
          <Form.Item
            name="firstName"
            rules={[{ required: true, message: '请输入您的名字' }]}
          >
            <Input 
              prefix={<UserOutlined className="site-form-item-icon" />} 
              placeholder="名字" 
            />
          </Form.Item>
          
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入您的电子邮箱' },
              { type: 'email', message: '请输入有效的电子邮箱' },
            ]}
          >
            <Input 
              prefix={<MailOutlined className="site-form-item-icon" />} 
              placeholder="电子邮箱" 
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度至少为6位' },
            ]}
            hasFeedback
          >
            <Input.Password 
              prefix={<LockOutlined className="site-form-item-icon" />} 
              placeholder="密码" 
            />
          </Form.Item>
          
          <Form.Item
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致！'));
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password 
              prefix={<LockOutlined className="site-form-item-icon" />} 
              placeholder="确认密码" 
            />
          </Form.Item>
          
          <Form.Item
            name="country"
            rules={[{ required: true, message: '请选择您所在的国家' }]}
          >
            <Select placeholder="选择国家">
              {countries.map(country => (
                <Option key={country} value={country}>{country}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入您的手机号码' }]}
          >
            <Input 
              prefix={<PhoneOutlined className="site-form-item-icon" />} 
              placeholder="手机号码" 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="register-form-button"
              block
            >
              注册
            </Button>
          </Form.Item>
          
          <div className="login-link">
            已有账户？<a href="/login">立即登录</a>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default RegisterPage;    