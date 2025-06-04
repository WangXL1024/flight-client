import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Form, Input, Select, Button, Space, Divider, Card, Alert, Steps, Table, Tag,
  message, Modal,
} from 'antd';
import { UserOutlined, PlusOutlined, CheckOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Step } = Steps;
const { Option } = Select;


function BookingPage() {
  const { tripType, outboundFlightId, returnFlightId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [outboundFlight, setOutboundFlight] = useState<any>(null);
  const [returnFlight, setReturnFlight] = useState<any>(null);
  const [passengers, setPassengers] = useState<{ // 新增乘客状态
    firstName: string;
    lastName: string;
    email: string;
  }[]>([{ firstName: '', lastName: '', email: '' }]); // 初始化至少1名乘客
  const [form] = Form.useForm();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingResponse, setBookingResponse] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
   const [modal, contextHolder] = Modal.useModal();
  useEffect(() => {
    // 检查用户是否已登录
    const storedUser = localStorage.getItem('currentUser');
    setIsLoggedIn(!!storedUser);

    // 获取航班信息
    const handleSearch = async () => {    
        try {
          const response_outbound = await axios.get('http://127.0.0.1:8080/api/flights/'+outboundFlightId);
          setOutboundFlight(response_outbound.data);
          // outboundFlight.flightType = "OUTBOUND"//异步调用，设定不可
          if (tripType === 'ROUND_TRIP' && returnFlightId) {
            const response_return = await axios.get('http://127.0.0.1:8080/api/flights/'+returnFlightId);
            setReturnFlight(response_return.data);
            // returnFlight.flightType = "RETURN"
          }
        } catch (err) {
          setError('搜索航班失败');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      handleSearch()

  }, [tripType, outboundFlightId, returnFlightId]);


  // 格式化时间
  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // 添加乘客
  const addPassenger = () => {
    setPassengers([...passengers, { firstName: '', lastName: '', email: '' }]);
  };

  // 移除乘客
  const removePassenger = (index: number) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index));
    } else {
      message.warning('至少需要一名乘客');
    }
  };

  // 下一步
  const nextStep = () => {
      if (currentStep === 0) {
        // 验证所有乘客字段
        const allValid = passengers.every(p => p.lastName && p.firstName && p.email);
        if (allValid) {
          setCurrentStep(1);
        } else {
          message.warning('请填写所有乘客信息');
        }
      } else if (currentStep === 1) {
        if (!isLoggedIn) {
          message.warning('请先登录以完成订单');
          navigate('/login');
          return;
        }
        setCurrentStep(2);
      }
    };

  // 上一步
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 提交订单
  const submitBooking = async () => {
      // 创建航班数据数组
      const flightData: any[] = [];

      // 添加去程航班并设置类型
      if (outboundFlight) {
        flightData.push({
          ...outboundFlight, // 复制原有属性
          flightType: 'OUTBOUND' // 添加航班类型
        });
      }

      // 添加返程航班并设置类型
      if (returnFlight) {
        flightData.push({
          ...returnFlight, // 复制原有属性
          flightType: 'RETURN' // 添加航班类型
        });
      }

      try {
        // 显示加载状态
        setLoading(true);
        
        // 1. 检查用户登录状态
        const storedUser = localStorage.getItem('currentUser');
        const authToken = localStorage.getItem('authToken');

        if (!storedUser || !authToken) {
          // 未登录，跳转到登录页面
          navigate('/login', { 
            state: { from: location.pathname }, // 保存当前路径用于登录后跳转
            replace: true 
          });
          return;
        }
        

        const user = JSON.parse(storedUser);

        const response = await axios.post('http://127.0.0.1:8080/api/bookings', 
          {
            userId: user.userId,
            flights: flightData,
            passengers: passengers
          },
          {
            headers: {
              'Authorization': authToken // 设置Token到请求头
            }
          }
        );
        
        setBookingResponse(response.data);
        
        // 显示成功模态框
        modal.success({
          title: '订单提交成功',
          content: '您的航班预订已成功提交，订单号：' + response.data.reference + '。我们已将订单详情发送至您的邮箱。',
          onOk: () => {
            navigate('/orders');
          },
        });
      } catch (err:any) {
          setError('预订失败');
          console.error(err);       
          // 处理Token无效的情况
          if (err.response?.status === 401) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            navigate('/login', { 
              state: { from: location.pathname },
              replace: true 
            });
          } else {
            // 显示其他错误提示
            modal.error({
              title: '预订失败',
              content: '很抱歉，您的预订未能成功处理。请稍后重试或联系客服。'
            });
          }
      } finally {
        // 隐藏加载状态
        setLoading(false);
      }
  };

  // 乘客表单
  const renderPassengerForms = () => {
    return passengers.map((passenger, index) => ( // 使用状态中的 passengers
      <Card key={index} title={`乘客 ${index + 1}`}>
        <Form.Item
          label="姓氏"
          name={['passengers', index, 'lastName']}
          rules={[{ required: true, message: '请输入姓氏' }]}
        >
          <Input value={passenger.lastName} onChange={(e) => { // 绑定表单值
            setPassengers(prev => {
              const newPassengers = [...prev];
              newPassengers[index].lastName = e.target.value;
              return newPassengers;
            });
          }} />
        </Form.Item>
        <Form.Item
          label="名字"
          name={['passengers', index, 'firstName']}
          rules={[{ required: true, message: '请输入名字' }]}
        >
          <Input value={passenger.firstName} onChange={(e) => { // 绑定表单值
            setPassengers(prev => {
              const newPassengers = [...prev];
              newPassengers[index].firstName = e.target.value;
              return newPassengers;
            });
          }} />
        </Form.Item>
        <Form.Item
          label="电子邮箱"
          name={['passengers', index, 'email']} 
          rules={[{ required: true, message: '请输入电子邮箱' }, { type: 'email', message: '请输入有效的电子邮箱' }]}
        >
          <Input value={passenger.email} onChange={(e) => { // 绑定表单值
            setPassengers(prev => {
              const newPassengers = [...prev];
              newPassengers[index].email = e.target.value;
              return newPassengers;
            });
          }} />
        </Form.Item>
        {passengers.length > 1 && ( // 仅当乘客数>1时显示删除按钮
          <Button type="link" onClick={() => removePassenger(index)}>
            删除乘客
          </Button>
        )}
      </Card>
    ));
  };

  // 航班信息表格
  const flightColumns = [
    {
      title: '航班号',
      dataIndex: 'flightNumber',
      key: 'flightNumber',
    },
    {
      title: '出发',
      dataIndex: 'departureAirport',
      key: 'departure',
      render: (departureAirport: { name: string }, record: any) => (
            <div>
                <div>{departureAirport.name}</div>
                <div className="text-sm text-gray-500">
                    {formatTime(record.departureTime)}
                </div>
            </div>
        ),
    },
    {
      title: '到达',
      dataIndex: 'destinationAirport',
      key: 'destination',
      render: (destinationAirport: { name: string }, record: any) => (
          <div>
              <div>{destinationAirport.name}</div>
              {/* <div className="text-sm text-gray-500">
                  {formatTime(record.arrivalTime)}
              </div> */}
          </div>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price:any) => `¥${price.toFixed(2)}`,
    },
  ];
// 订单摘要
  const renderOrderSummary = () => {
    const flightData = [outboundFlight];
    if (returnFlight) {
      flightData.push(returnFlight);
    }

    const totalPrice = flightData.reduce((sum, flight) => sum + flight.price * passengers.length, 0);

    return (
      <div>
        <h3>航班信息</h3>
        <Table 
          dataSource={flightData} 
          columns={flightColumns} 
          rowKey="flightId" 
          pagination={false}
        />

        <h3 className="mt-6">乘客信息</h3>
        <Table
          dataSource={passengers}
          columns={[
            {
              title: '姓名',
              dataIndex: '',
              key: 'name',
              render: (_, record) => `${record.lastName} ${record.firstName}`,
            },
            {
              title: '电子邮箱',
              dataIndex: 'email',
              key: 'email',
            },
          ]}
          rowKey={(record: any, index: any) => index.toString()}
          pagination={false}
        />

        <h3 className="mt-6">订单总价</h3>
        <div className="order-total">
          <div className="flex justify-between py-2">
            <span>机票总价 ({passengers.length} 位乘客)</span>
            <span>¥{totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 font-bold border-t">
            <span>应付总额</span>
            <span>¥{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  // 渲染当前步骤内容
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Alert 
              message="请填写所有乘客信息" 
              type="info" 
              showIcon 
              style={ { marginBottom: 16 } } 
            />
            <Form form={form} layout="vertical">
              {renderPassengerForms()}
              <Button 
                type="dashed" 
                onClick={addPassenger} 
                block 
                style={{ margin: '16px 0' }}
              >
                <PlusOutlined /> 添加乘客
              </Button>
            </Form>
          </div>
        );
      case 1:
        return (
          <div>
            <Alert 
              message="请确认您的订单信息" 
              type="info" 
              showIcon 
              style={ { marginBottom: 16 } } 
            />
            {renderOrderSummary()}
          </div>
        );
      case 2:
        return (
          <>
          {contextHolder}
          <div className="success-message">
            <CheckOutlined className="success-icon" />
            <h2>请确认提交订单</h2>
            <p>请确认您的订单信息无误，提交后我们将为您预订所选航班。</p>
            <div className="mt-6">
              <Button 
                type="primary" 
                size="large"
                onClick={submitBooking}
              >
                提交订单
              </Button>
            </div>
          </div>
          </>
        );
      default:
        return <div>未知步骤</div>;
    }
  };

return (
    <div className="booking-page">
      <Steps current={currentStep} className="mb-8">
        <Step title="乘客信息" icon={<UserOutlined />} />
        <Step title="订单确认" icon={<CheckOutlined />} />
        <Step title="提交订单" icon={<CheckOutlined />} />
      </Steps>

      {outboundFlight ? (
        <div className="booking-content">
          {renderCurrentStep()}
        </div>
      ) : (
        <Alert message="未找到航班信息" type="error" showIcon />
      )}

      <Divider />

      <div className="booking-actions">
        {/* {currentStep > 0 && (
          <Button onClick={prevStep} style={{ marginRight: 8 }}>
            上一步
          </Button>
        )}
        {currentStep < 2 && (
          <Button type="primary" onClick={nextStep}>
            下一步
          </Button>
        )} */}
        {currentStep > 0 ? (
          <Button onClick={prevStep}>
            上一步
          </Button>
        ) : (
          <Button onClick={() => navigate(-1)}>
            返回
          </Button>
        )}
        {currentStep < 2 && (
          <Button type="primary" onClick={nextStep}>
            下一步
          </Button>
        )}
      </div>
    </div>
  );
}

export default BookingPage;    