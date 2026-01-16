using UnityEngine;
using UnityEngine.Rendering;

[RequireComponent(typeof(Rigidbody2D))]
[RequireComponent(typeof(SortingGroup))]
public class Player : Entity
{
    public float movementSpeed = 5f;

    private Vector3 _bannedTargetPosition = INFINITY_VECTOR;
    private Vector3 _targetPosition;
    private Vector3 _oldPosition;
    private Vector3 _currentDirection;
    private Vector3 _afterStairsDirection;
    private Vector3? _stairsTargetPositin = null;

    private bool OnStairs => _stairsTargetPositin != null;

    private static Vector3 INFINITY_VECTOR = new(float.PositiveInfinity, float.PositiveInfinity, float.PositiveInfinity);

    public bool hittingWall = false;
    public bool inTunnel = false;
    public bool ignoreTunnel = false;
    public bool climbingStairs = false;
    public bool canMove = true;

    private SortingGroup _group = null;
    private SortingGroup Group => _group ??= GetComponent<SortingGroup>();

    public override void Setup(Vector3 spawnPosition)
    {
        canMove = true;
        _targetPosition = spawnPosition;
        base.Setup(spawnPosition);
    }

    public override void StartBattle(Entity opponent)
    {
        base.StartBattle(opponent);
        canMove = false;
    }

    public override void EndBattle(bool win)
    {
        base.EndBattle(win);
        canMove = true;

        _bannedTargetPosition = INFINITY_VECTOR;
    }

    protected override void LookAtPlayer() { }

    private void OnTriggerEnter2D(Collider2D collision)
    {
        if (collision.gameObject.CompareTag("RaisedFloor") && !inTunnel)
            ignoreTunnel = true;

        if (OnStairs || climbingStairs) return;

        if (collision.CompareTag("Enemy") && !inTunnel)
            OnEnemyCollide(collision.gameObject);

        if (collision.gameObject.CompareTag("Tunnel") && !ignoreTunnel)
            inTunnel = true;

        if (collision.gameObject.CompareTag("Wall") && !inTunnel)
            OnHitWall();

        if (collision.gameObject.CompareTag("HiddenWall") && inTunnel)
            OnHitWall();
    }

    private void OnEnemyCollide(GameObject enemyObject)
    {
        OnHitWall();

        if (!GameWorld.Instance.Entities.TryGetValue(enemyObject, out Entity enemyEntity))
            return;

        StartBattle(enemyEntity);
        enemyEntity.StartBattle(this);
        QuestionUI.Instance.Setup(this, enemyEntity);

        this.SmartLog($"Collided with enemy: {enemyEntity}");
    }

    private void OnHitWall()
    {
        _bannedTargetPosition = _targetPosition;
        hittingWall = true;
    }

    private void OnTriggerExit2D(Collider2D collision)
    {
        if (collision.gameObject.CompareTag("RaisedFloor") && !inTunnel)
            ignoreTunnel = false;

        if (collision.CompareTag("Enemy") && !inTunnel)
            OnExitWall();

        if (collision.gameObject.CompareTag("Tunnel") && !ignoreTunnel)
            inTunnel = false;

        if (collision.gameObject.CompareTag("Wall") && !inTunnel)
            OnExitWall();

        if (collision.gameObject.CompareTag("HiddenWall") && inTunnel)
            OnExitWall();
    }

    private void OnExitWall()
    {
        hittingWall = false;
    }

    public void MoveGrid(Vector3 direction)
    {
        if (!canMove || _isMoving || hittingWall)
            return;

        if (direction.x != 0)
            direction = Vector3.right * direction.x;
        else if (direction.y != 0)
            direction = Vector3.up * direction.y;
        else
            return;

        _currentDirection = direction.normalized;

        if (!hittingWall)
            _oldPosition = transform.position;
        _targetPosition = transform.position + _currentDirection;

        if (_targetPosition == _bannedTargetPosition)
            return;

        if (_currentDirection.x > 0)
            LookRight();
        else if (_currentDirection.x < 0)
            LookLeft();

        _bannedTargetPosition = INFINITY_VECTOR;
        _isMoving = true;
    }

    public void MoveStairs(Vector3 targetPosition, Vector3 afterStairDirection)
    {
        if (!canMove || OnStairs || climbingStairs || inTunnel) return;

        _stairsTargetPositin = targetPosition;
        _afterStairsDirection = afterStairDirection;

        if (_afterStairsDirection.x > 0)
            LookRight();
        else if (_afterStairsDirection.x < 0)
            LookLeft();
    }

    protected override void Update()
    {
        base.Update();

        Group.sortingLayerName = inTunnel ? "HiddenCharacter" : "Character";

        if (hittingWall)
            _targetPosition = _oldPosition;

        if (_isMoving)
        {
            transform.position = Vector3.MoveTowards(transform.position, _targetPosition, movementSpeed * Time.deltaTime);

            if (transform.position == _targetPosition)
                if (OnStairs)
                {
                    _targetPosition = _stairsTargetPositin.Value;
                    _stairsTargetPositin = null;
                    climbingStairs = true;
                } else if (climbingStairs)
                {
                    _targetPosition += _afterStairsDirection;
                    climbingStairs = false;
                } else
                    _isMoving = false;
        }
    }
}
