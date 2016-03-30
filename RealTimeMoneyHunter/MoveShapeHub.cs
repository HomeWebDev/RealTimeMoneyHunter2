using System;
using System.Threading;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace MoveShapeDemo
{
    public class Broadcaster
    {
        private readonly static Lazy<Broadcaster> _instance =
            new Lazy<Broadcaster>(() => new Broadcaster());
        // We're going to broadcast to all clients a maximum of 25 times per second
        private readonly TimeSpan BroadcastInterval =
            TimeSpan.FromMilliseconds(50);
        private readonly IHubContext _hubContext;
        private Timer _broadcastLoop;
        private ShapeModel _model;
        private ShapeModel _coinModel;
        private bool _modelUpdated;
        private bool _coinUpdated;
        private bool _userPick;
        private bool _getUser;
        private string _user;
        public Broadcaster()
        {
            // Save our hub context so we can easily use it 
            // Faskdklas
            // to send to its connected clients
            _hubContext = GlobalHost.ConnectionManager.GetHubContext<MoveShapeHub>();
            _model = new ShapeModel();
            _modelUpdated = false;
            // Start the broadcast loop
            _broadcastLoop = new Timer(
                BroadcastShape,
                null,
                BroadcastInterval,
                BroadcastInterval);
        }
        public void BroadcastShape(object state)
        {
            // No need to send anything if our model hasn't changed
            if (_modelUpdated)
            {
                // This is how we can access the Clients property 
                // in a static hub method or outside of the hub entirely
                _hubContext.Clients.AllExcept(_model.LastUpdatedBy).updateShape(_model);
                _modelUpdated = false;
            }

            //If coin was updated
            if (_coinUpdated)
            {
                _hubContext.Clients.All.updateCoinShape(_coinModel);
                _coinUpdated = false;
            }
            if (_userPick)
            {
                _hubContext.Clients.All.userChoose(_model);
                _userPick = false;
            }
            if (_getUser)
            {
                _hubContext.Clients.Client(_user).getUser(_user);
                _getUser = false;
            }
        }
        public void UpdateShape(ShapeModel clientModel)
        {
            _model = clientModel;
            _modelUpdated = true;
        }
        public void UpdateCoinShape(ShapeModel coinModel)
        {
            _coinModel = coinModel;
            _coinUpdated = true;
        }

        public void UserChoose(ShapeModel clientModel)
        {
            _model = clientModel;
            _userPick = true;
            //_hubContext.Clients.AllExcept(_model.LastUpdatedBy).userChoose(_model);
            //_hubContext.Clients.All.userChoose(_model);
        }

        public void GetUser(string user)
        {
            _getUser = true;
            _user = user;
            //_hubContext.Clients.Client(user).getUser(user);
        }


        public static Broadcaster Instance
        {
            get
            {
                return _instance.Value;
            }
        }
    }

    public class MoveShapeHub : Hub
    {
        // Is set via the constructor on each creation
        private Broadcaster _broadcaster;
        private static readonly ConcurrentDictionary<string, ShapeModel> _connections =
            new ConcurrentDictionary<string, ShapeModel>();

        public MoveShapeHub()
            : this(Broadcaster.Instance)
        {
        }
        public MoveShapeHub(Broadcaster broadcaster)
        {
            _broadcaster = broadcaster;
        }
        public void UpdateModel(ShapeModel clientModel)
        {
            clientModel.LastUpdatedBy = Context.ConnectionId;
            // Update the shape model within our broadcaster
            _broadcaster.UpdateShape(clientModel);
        }

        public Task UpdateScore(ShapeModel clientModel)
        {
            if (System.Web.HttpContext.Current.Application["score"] == null)
            {
                System.Web.HttpContext.Current.Application["score"] = 0;
            }
            else
            {
                System.Web.HttpContext.Current.Application["score"] = Convert.ToInt32(System.Web.HttpContext.Current.Application["score"]) + 1;
            }

            int testScore = Convert.ToInt32(System.Web.HttpContext.Current.Application["score"]);

            ShapeModel sm = new ShapeModel();
            _connections.TryGetValue(Context.ConnectionId,out sm);

            sm.CoinScore += 5;

            foreach (var item in _connections.Values)
            {
                if(item.CoinScore > 100)
                {
                    return Clients.All.winner(item);

                }
            }
            
            return Clients.All.updateScore(sm);
            // Update the shape model within our broadcaster
        }

        public Task ClearScoreForAllUsers()
        {
            foreach (var item in _connections.Values)
            {
                item.CoinScore = 0;
            }
            return Clients.All.clearScoreForAllUsers();
        }

        public void MoveCoin(ShapeModel coinModel)
        {
            //Move coin to random position within game area
            Random rnd = new Random();
            int randLeft = rnd.Next(1, 1000);
            int randTop = rnd.Next(1, 500);
            coinModel.Left = randLeft;
            coinModel.Top = randTop;

            // Update the shape model within our broadcaster
            _broadcaster.UpdateCoinShape(coinModel);
        }

        public void GetUser()
        {            
            _broadcaster.GetUser(Context.ConnectionId);
        }

        public async Task<string> GetUserN()
        {
           return await Clients.Caller.getUserN(Context.ConnectionId);
        }


        public void UserChoose(ShapeModel clientModel)
        {
            if (clientModel.ShapeOwner == null ||
                clientModel.ShapeOwner.Equals("none"))
            {
                clientModel.LastUpdatedBy = Context.ConnectionId;
                clientModel.ShapeOwner = Context.ConnectionId;
                _broadcaster.UserChoose(clientModel);
            }
        }

        public Task OtherPlayer(ShapeModel clientModel)
        {
            clientModel.ShapeOwner = Context.ConnectionId;
            ShapeModel temp = new ShapeModel();
            _connections.TryGetValue(clientModel.ShapeOwner, out temp);
            return Clients.Others.otherPlayer(temp);
        }

        public override Task OnConnected()
        {
            ShapeModel sm = new ShapeModel();
            sm.ShapeOwner = Context.ConnectionId;
            sm.PlayerId = "player" + (_connections.Count + 1).ToString();
            _connections.TryAdd(Context.ConnectionId, sm);
            return Clients.All.clientConnected(sm);
        }

        //public override Task OnConnected()
        //{
        //    _connections.TryAdd(Context.ConnectionId, null);
        //    return Clients.All.clientCountChanged(_connections.Count);
        //}

        public override Task OnReconnected()
        {
            _connections.TryAdd(Context.ConnectionId, null);
            return Clients.All.clientCountChanged(_connections.Count);
        }

        public override Task OnDisconnected()
        {
            ShapeModel sm = new ShapeModel();
            sm.ShapeOwner = Context.ConnectionId;
            sm.PlayerId = "player" + _connections.Count.ToString();
            sm.CoinScore = 0;
            ShapeModel value;
            _connections.TryRemove(Context.ConnectionId, out value);
            return Clients.AllExcept(Context.ConnectionId).clientDisconnected(sm);
        }


        //public override Task OnDisconnected()
        //{
        //    object value;
        //    _connections.TryRemove(Context.ConnectionId, out value);
        //    return Clients.All.clientCountChanged(_connections.Count);
        //}
    }
    public class ShapeModel
    {
        // We declare Left and Top as lowercase with 
        // JsonProperty to sync the client and server models
        [JsonProperty("left")]
        public double Left { get; set; }
        [JsonProperty("top")]
        public double Top { get; set; }
        // We don't want the client to get the "LastUpdatedBy" property
        [JsonIgnore]
        public string LastUpdatedBy { get; set; }
        [JsonProperty("ShapeId")]
        public int ShapeId { get; set; }
        [JsonProperty("ShapeOwner")]
        public string ShapeOwner { get; set; }
        [JsonProperty("PlayerId")]
        public string PlayerId { get; set; }
        [JsonProperty("CoinScore")]
        public int CoinScore { get; set; }
    }

}
